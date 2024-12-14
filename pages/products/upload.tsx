import type { NextPage } from "next";
import Button from "@components/Button";
import Input from "@components/Input";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import { useForm } from "react-hook-form";
// import useMutation from "@libs/client/useMutation";
import { useEffect, useRef, useState } from "react";
import { Product } from "@prisma/client";
import { useRouter } from "next/router";
import useUser from "@libs/client/useUser";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import Image from "next/image";
import cameraIcon from "public/images/camera.png";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css"; // Swiper 기본 스타일
import "swiper/css/navigation"; // 네비게이션 스타일
import { Navigation } from "swiper/modules";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

interface UploadProductForm {
  name: string;
  price: number;
  description: string;
  photo?: FileList;
}

interface CLImage {
  imageId: string;
}

interface UploadProduct extends UploadProductForm {
  images: CLImage[];
}

interface UploadProductMutation {
  ok: boolean;
  products: Product;
}

interface PreviewImage {
  id: string; // 고유 ID 필드
  kind: "Local" | "Cloudflare";
  url: string;
  file?: File | null;
  CLurl?: string;
}

const SortableItem = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const Upload: NextPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch } = useForm<UploadProductForm>();
  // const [preview, setPreview] = useState([]); // 프리뷰 이미지 배열
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const sensors = useSensors(useSensor(PointerSensor)); // PointerSensor 사용

  const maxImages = 10;
  const [previewPerView, setPreviewPerView] = useState(3); // 한 번에 표시할 프리뷰 이미지 개수
  const [initialPreview, setInitialPreview] = useState([]); // 초기 로딩된 프리뷰
  const [deletedCLImage, setDeletedCLImage] = useState([]); // 삭제된 Cloudflare 이미지 배열
  const [isDragEnabled, setIsDragEnabled] = useState(true); // 드래그 모드 활성화 여부
  const formRef = useRef<HTMLFormElement>(null); // form 태그 참조
  const [formSize, setFormSize] = useState({ width: 0, height: 0 }); // form 크기 저장

  const calculateFormSize = () => {
    if (formRef.current) {
      const { offsetWidth, offsetHeight } = formRef.current; // form 태그의 크기 계산
      setFormSize({ width: offsetWidth, height: offsetHeight });
    }
  };
  // const [uploadProduct, { loading, data }] = useMutation<UploadProductMutation>("/api/products");
  const uploadProduct = async (
    // formData: UploadProductForm & { imageIds?: string[] }
    uploadProduct: UploadProduct
  ) => {
    const response = await axios.post("/api/products", uploadProduct, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  };

  const { mutate, isLoading, data } = useMutation(uploadProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries("products");
    },
  });

  // const [images, setImages] = useState<File[]>([]);

  // 화면 크기에 따라 previewPerView 자동 계산
  const calculatePreviewPerView = () => {
    const paddingWidth = 32;
    const addImageButtonWidth = 96;
    const previewLeftPadding = 16;
    const previewRightPadding = 16;
    const containerWidth =
      formSize.width - paddingWidth - addImageButtonWidth - previewRightPadding; // 여유 공간 제외 (패딩 16px * 2)
    const previewWidth = 96; // 프리뷰 이미지 고정 너비 (24px * 4 = 96px)
    const perView = Math.floor(
      containerWidth / (previewWidth + previewLeftPadding)
    ); // 표시할 이미지 개수 계산
    setPreviewPerView(perView > maxImages ? maxImages : perView); // 최대값 제한
  };

  useEffect(() => {
    // 초기 렌더링 시 크기 계산
    calculateFormSize();
    calculatePreviewPerView();
    window.addEventListener("resize", calculatePreviewPerView);
    return () => {
      window.removeEventListener("resize", calculatePreviewPerView);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages: PreviewImage[] = files.map((file, index) => ({
        id: `image-${Date.now()}-${index}`, // 고유 ID 생성
        kind: "Local", // 새로 추가된 이미지는 항상 Local
        url: URL.createObjectURL(file),
        file,
      }));
      setPreviewImages((prev) => [...prev, ...newImages].slice(0, maxImages));
    }
  };

  // const handleFileChange = async (files: FileList) => {
  //   const newPreview = [...preview];
  //   for (const file of Array.from(files)) {
  //     const url = URL.createObjectURL(file);
  //     newPreview.push({ kind: Kind.Local, url, file, CLurl: "" });
  //   }
  //   setPreview(newPreview);
  // };

  // const handleImageUpload = async () => {
  //   try {
  //     // 1. 서버에서 필요한 업로드 URL들을 요청
  //     const { uploadURLs } = await axios
  //       .get(`/api/files?count=${previewImages.length}`)
  //       .then((res) => res.data);

  //     // 2. 각 이미지 파일을 업로드
  //     const updatedImages = await Promise.all(
  //       previewImages.map(async (image, index) => {
  //         if (image.kind === "Local" && image.file) {
  //           // 업로드 URL 가져오기
  //           const uploadURL = uploadURLs[index].uploadURL;

  //           // FormData를 사용하여 이미지 업로드
  //           const formData = new FormData();
  //           formData.append("file", image.file);
  //           const {
  //             data: {
  //               result: { id },
  //             },
  //           } = await axios.post(uploadURL, formData);

  //           // Cloudflare 업로드 완료된 이미지 데이터 반환
  //           return { kind: "Cloudflare", url: id, file: null, CLurl: id };
  //         }
  //         return image;
  //       })
  //     );

  //     // 3. 업로드된 이미지 데이터로 상태 업데이트
  //     setPreviewImages(updatedImages);

  //     return updatedImages;
  //   } catch (error) {
  //     console.error("이미지 업로드 중 오류 발생:", error);
  //   }
  // };

  const handleImageUpload = async () => {
    try {
      // 1. 서버에서 필요한 업로드 URL들을 요청
      const { uploadURLs } = await axios
        .get(`/api/files?count=${previewImages.length}`)
        .then((res) => res.data);

      const updatedImages: PreviewImage[] = []; // 업로드 완료된 이미지들을 저장할 배열

      // 2. 각 이미지 파일을 순차적으로 업로드
      for (let i = 0; i < previewImages.length; i++) {
        const image = previewImages[i];

        if (image.kind === "Local" && image.file) {
          try {
            // 업로드 URL 가져오기
            const uploadURL = uploadURLs[i].uploadURL;

            // FormData 생성 및 파일 추가
            const formData = new FormData();
            formData.append("file", image.file);

            // 이미지 업로드
            const {
              data: {
                result: { id },
              },
            } = await axios.post(uploadURL, formData);

            // Cloudflare 업로드 완료된 이미지 데이터를 배열에 추가
            updatedImages.push({
              id: image.id, // 기존 이미지의 ID를 유지
              kind: "Cloudflare",
              url: id,
              file: null,
              CLurl: id,
            });
          } catch (error) {
            console.error(`이미지 업로드 실패 (ID: ${image.id})`, error);

            // 실패한 이미지는 그대로 유지하거나, 로컬 이미지로 유지
            updatedImages.push(image);
          }
        } else {
          // 업로드가 필요 없는 이미지는 그대로 배열에 추가
          updatedImages.push(image);
        }
      }

      // 3. 업로드된 이미지 데이터로 상태 업데이트
      setPreviewImages(updatedImages);

      return updatedImages;
    } catch (error) {
      console.error("이미지 업로드 중 전체 오류 발생:", error);
    }
  };

  // const handleImageDelete = (index: number) => {
  //   const newPreview = preview.filter((_, i) => i !== index);
  //   setPreview(newPreview);
  // };

  const handleImageDelete = (id: string) => {
    const updatedPreviewImages = previewImages.filter(
      (image) => image.id !== id
    );
    setPreviewImages(updatedPreviewImages);
  };

  // const handleUpdateItem = async () => {
  //   // Local 이미지를 Cloudflare에 업로드하고 URL을 업데이트
  //   const updatedImages = await Promise.all(
  //     previewImages.map(async (image) => {
  //       if (image.kind === "Local" && image.file) {
  //         // Cloudflare 업로드 URL을 가져옴
  //         const {
  //           data: { uploadURL },
  //         } = await axios.get("/api/files");

  //         // FormData에 파일을 추가하여 업로드
  //         const formData = new FormData();
  //         formData.append("file", image.file);
  //         const {
  //           data: {
  //             result: { id },
  //           },
  //         } = await axios.post(uploadURL, formData, {
  //           headers: {
  //             "Content-Type": "multipart/form-data",
  //           },
  //         });

  //         // Cloudflare 업로드 후 URL 업데이트
  //         return { kind: "Cloudflare", url: id };
  //       }
  //       return image; // 이미 Cloudflare에 있는 경우 그대로 반환
  //     })
  //   );

  //   setPreviewImages(updatedImages); // 업데이트된 프리뷰 이미지 배열 설정

  //   // 이 시점에서 Cloudflare에 업로드된 이미지의 URL을 사용해 서버에 업데이트 요청을 보낼 수 있음
  //   console.log("업데이트 완료:", updatedImages);
  // };

  const handleResetPreview = () => {
    setPreviewImages([...initialPreview]);
  };

  // const handleDragEnd = (result: any) => {
  //   if (!result.destination) return;
  //   const reorderedImages = Array.from(previewImages);
  //   const [removed] = reorderedImages.splice(result.source.index, 1);
  //   reorderedImages.splice(result.destination.index, 0, removed);
  //   setPreviewImages(reorderedImages);
  // };

  // Drag & Drop 순서 변경 처리
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = previewImages.findIndex((image) => image.id === active.id);
    const newIndex = previewImages.findIndex((image) => image.id === over.id);
    // 잘못된 범위 초과 방지
    if (newIndex < 0 || newIndex >= maxImages) return;
    const newOrder = arrayMove(previewImages, oldIndex, newIndex); // 순서 변경
    setPreviewImages(newOrder);
  };

  // const onValid = async ({
  //   name,
  //   price,
  //   description,
  //   photo,
  // }: UploadProductForm) => {
  //   if (isLoading) return;
  //   if (photo && photo.length > 0) {
  //     const { uploadURL } = await axios
  //       .get(`/api/files`)
  //       .then((res) => res.data); // cloudflare에서 업로드할 url을 얻어온다.
  //     const form = new FormData();
  //     form.append("file", photo[0], name); // form을 file 타입으로 만들고 photo[0]를 블랍(binary large object) 입력으로 사용하고 파일명을 name으로 사용한다.
  //     const {
  //       result: { id },
  //     } = await axios
  //       .post(uploadURL, form, {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //         },
  //       })
  //       .then((res) => res.data); // 이미지 폼을 uploadURL에 업로드한다. 업로드된 이미지의 URL을 id로 받는다.
  //     mutate({ name, price, description, photoId: id }); // 이미지의 URL인 id를 name, price, description을 함께 backend에 기록한다.
  //   } else {
  //     mutate({ name, price, description });
  //   }
  //   // if (photo && photo.length > 0) {
  //   //   console.log("phote, photo[0]: ", photo, photo[0]);
  //   //   const form = new FormData();

  //   //   // https://javascript.info/formdata
  //   //   /*
  //   //   formData.append("image", imageBlob, "image.png");

  //   //   That’s same as if there were <input type="file" name="image"> in the form,
  //   //   and the visitor submitted a file named "image.png" (3rd argument) with the data imageBlob (2nd argument) from their filesystem.
  //   //   The server reads form data and the file, as if it were a regular form submission.
  //   //   */
  //   //   form.append("file", photo[0], name); // file: 타입, photo[0]: image blob, name: file name
  //   //   const result = await (
  //   //     await fetch("/api/images/file-upload", {
  //   //       method: "POST",
  //   //       body: form,
  //   //     })
  //   //   ).json();
  //   //   console.log("result: ", result);
  //   //   uploadProduct({ name, price, description, photoId: result.data.url });
  //   // } else {
  //   //   uploadProduct({ name, price, description });
  //   // }
  // };

  const onValid = async (data: UploadProductForm) => {
    if (isLoading) return;
    // 1. Cloudflare로 이미지 업로드 처리
    const updatedPreview = await handleImageUpload();
    // 2. 업로드된 이미지의 URL 또는 ID 배열 생성
    const images: CLImage[] = (updatedPreview || []).map((img) => ({
      imageId: img.CLurl || "", // undefined 방지를 위해 빈 문자열 처리
    }));
    // 3. 상품 데이터와 함께 이미지 정보 전송
    const uploadProductData: UploadProduct = {
      ...data,
      images, // 이미지 정보 배열 포함
    };
    mutate(uploadProductData);
  };

  useEffect(() => {
    if (data?.ok) {
      // 업로드가 잘 되었다면 ....
      router.push(`/products/${data.products.id}`);
    }
  }, [data, router]);
  const photo = watch("photo");
  const [photoPreview, setPhotoPreview] = useState("");
  useEffect(() => {
    if (photo && photo.length > 0) {
      const file = photo[0];
      setPhotoPreview(URL.createObjectURL(file)); // 이미지 블랍인 file을 we will use this to show the preview of the image: blob
      // https://kyounghwan01.github.io/blog/JS/JSbasic/Blob-url/
      // URL.createObjectURL() 메소드는 주어진 객체를 가리키는 URL을 DOMString으로 변환하는 기능을 합니다.
      // 해당 url은 window 창이 사라지면 함께 사라집니다. 그에 따라 다른 window에서 재 사용이 불가능하고 이 URL은 수명이 한정되있습니다.
    }
  }, [photo]);

  return (
    <Layout seoTitle="상품 올리기" canGoBack title="상품 올리기" backUrl="back">
      <form
        ref={formRef}
        className="space-y-4 p-4"
        onSubmit={handleSubmit(onValid)}
      >
        <DndContext
          sensors={isDragEnabled ? sensors : []}
          collisionDetection={isDragEnabled ? closestCenter : undefined}
          onDragEnd={isDragEnabled ? handleDragEnd : undefined}
        >
          {/* 버튼 및 토글 그룹 */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-md border border-gray-300">
              <label className="flex cursor-pointer flex-col items-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-md border border-gray-300">
                  <Image
                    src="/images/camera.png"
                    alt="Upload"
                    width={30}
                    height={30}
                  />
                  <span className="mt-1 text-sm text-gray-600">
                    {previewImages.length}/{maxImages}
                  </span>
                </div>
              </label>
            </div>
            {/* 탭 컨테이너 */}
            <div className="flex items-center rounded-md bg-gray-200 p-1">
              <button
                onClick={() => setIsDragEnabled(false)} // 드래그 모드 비활성화
                className={`rounded-md px-4 py-2 ${
                  !isDragEnabled
                    ? "border border-blue-500 bg-white font-bold text-blue-500"
                    : "text-gray-500"
                }`}
              >
                삭제하기
              </button>
              <button
                onClick={() => setIsDragEnabled(true)} // 드래그 모드 활성화
                className={`rounded-md px-4 py-2 ${
                  isDragEnabled
                    ? "border border-blue-500 bg-white font-bold text-blue-500"
                    : "text-gray-500"
                }`}
              >
                순서변경
              </button>
            </div>
            {/* 프리뷰 이미지 영역 */}
            <SortableContext
              items={previewImages.map((image) => image.id)} // 프리뷰 이미지의 id만 전달
              strategy={horizontalListSortingStrategy}
            >
              <div className="grid grid-cols-5 gap-4">
                {previewImages.map((image, index) => (
                  <SortableItem key={image.id} id={image.id}>
                    <div
                      className={`relative h-20 w-20 overflow-hidden rounded-md ${
                        index === 0
                          ? "border-2 border-blue-500"
                          : "border border-gray-300"
                      }`}
                    >
                      {/* <img
                      src={image.url}
                      alt={`Preview ${index}`}
                      className="object-cover w-full h-full"
                    /> */}
                      <Image
                        src={image.url}
                        alt={`Preview ${index}`}
                        layout="fill" // 부모 요소를 꽉 채움
                        objectFit="cover" // 부모 요소에 맞게 이미지 크기 조정
                        quality={75} // 이미지 품질
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // 반응형 크기
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleImageDelete(image.id);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        className="absolute right-1 top-1 z-10 rounded-full bg-red-500 p-1 text-xs text-white"
                      >
                        ×
                      </button>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </div>
        </DndContext>

        <Input
          register={register("name", { required: true })}
          label="Name"
          name="name"
          type="text"
        />
        <Input
          register={register("price", { required: true })}
          label="Price"
          placeholder="0"
          name="price"
          type="number"
          kind="price"
        />
        <TextArea
          register={register("description", { required: true })}
          name="description"
          label="Description"
        />
        <Button text={isLoading ? "Loading" : "Upload item"} />
      </form>
    </Layout>
  );
};

export default Upload;
