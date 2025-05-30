import type { NextPage } from "next";
import Button from "@components/Button";
import Input from "@components/Input";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { Product } from "@prisma/client";
import { useRouter } from "next/router";
import useUser from "@libs/client/useUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import cameraIcon from "public/images/camera.png";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css"; // Swiper 기본 스타일
import "swiper/css/navigation"; // 네비게이션 스타일
import { Navigation } from "swiper/modules";
//import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "react-toastify";
import {
  PreviewImage,
  UploadProductForm,
  UploadProduct,
  UploadProductMutation,
  CLImage,
} from "@/types";
import { writeProduct } from "@/apiLibs/products";

// interface UploadProductForm {
//   name: string;
//   price: number;
//   description: string;
//   photo?: FileList;
// }

// interface CLImage {
//   imageId: string;
// }

// interface UploadProduct extends UploadProductForm {
//   images: CLImage[];
// }

// interface UploadProductMutation {
//   ok: boolean;
//   products: Product;
// }

// interface PreviewImage {
//   id: string; // 고유 ID 필드
//   kind: "Local" | "Cloudflare";
//   url: string;
//   file?: File | null;
//   CLurl?: string;
// }

const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

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
  // 기본 센서 설정
  const [isDragEnabled, setIsDragEnabled] = useState(true); // 드래그 모드 활성화 여부
  const pointerSensor = useSensor(PointerSensor, {
    // 드래그 모드가 비활성화되었을 때 동작하지 않도록 설정
    activationConstraint: isDragEnabled ? undefined : { distance: 9999 },
  });
  const sensors = useSensors(pointerSensor); // sensors 설정
  const maxImages = 10;
  const [previewPerView, setPreviewPerView] = useState(3); // 한 번에 표시할 프리뷰 이미지 개수
  const [initialPreview, setInitialPreview] = useState([]); // 초기 로딩된 프리뷰
  const [deletedCLImage, setDeletedCLImage] = useState([]); // 삭제된 Cloudflare 이미지 배열
  const [formSize, setFormSize] = useState({ width: 0, height: 0 }); // form 크기 저장

  const {
    mutate,
    isPending: isLoading,
    data,
  } = useMutation({
    mutationFn: writeProduct,
    onSuccess: (data) => {
      console.log("onSuccess-----------: data", data);
      // 쿼리 무효화 (v5 방식)
      //queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("상품 업로드 실패:", error);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      console.log("handleFileChange clicked!!");
      console.log("files: ", files);
      // 현재 선택된 각 파일에 대해 중복 체크
      const duplicateFileNames = files
        .filter((newFile) => {
          console.log("dup---newFile.name:", newFile.name);
          console.log("dup---previewImages: ", previewImages);
          return previewImages.some((existingImage) => existingImage.file?.name === newFile.name);
        })
        .map((file) => file.name);

      // 중복된 파일이 있으면 toast 메시지 표시
      if (duplicateFileNames.length > 0) {
        toast.warn(`이미 첨부된 이미지입니다: ${duplicateFileNames.join(", ")}`, {
          position: "top-center",
          autoClose: 3000,
          closeOnClick: true,
        });
      }

      // 중복되지 않은 파일만 필터링하여 처리
      const uniqueFiles = files.filter(
        (newFile) =>
          !previewImages.some((existingImage) => existingImage.file?.name === newFile.name)
      );

      if (uniqueFiles.length > 0) {
        const totalImages = previewImages.length + uniqueFiles.length;
        if (totalImages > maxImages) {
          toast.error(`이미지는 최대 ${maxImages}개까지 업로드 가능합니다.`);
          return;
        }

        const newImages: PreviewImage[] = uniqueFiles.map((file, index) => ({
          id: `local-${Date.now()}-${index}`,
          kind: "Local",
          url: URL.createObjectURL(file),
          file,
        }));

        setPreviewImages((prev) => [...prev, ...newImages]);
        // 선택 후 value 초기화
        e.target.value = "";
      }
      // const newImages: PreviewImage[] = files.map((file, index) => ({
      //   id: `local-${Date.now()}-${index}`,
      //   kind: "Local", // 새로 추가된 이미지는 항상 Local
      //   url: URL.createObjectURL(file),
      //   file,
      // }));
      // setPreviewImages((prev) => [...prev, ...newImages].slice(0, maxImages));
    }
  };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files) {
  //     const files = Array.from(e.target.files);
  //     const newImages: PreviewImage[] = files.map((file, index) => ({
  //       id: `local-${Date.now()}-${index}`,
  //       kind: "Local", // 새로 추가된 이미지는 항상 Local
  //       url: URL.createObjectURL(file),
  //       file,
  //     }));
  //     setPreviewImages((prev) => [...prev, ...newImages].slice(0, maxImages));
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
              url: image.url, // preview blob url
              file: null,
              CLurl: id, // cloudflare image hash
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
      // setPreviewImages(updatedImages);

      return updatedImages;
    } catch (error) {
      console.error("이미지 업로드 중 전체 오류 발생:", error);
    }
  };

  // const handleImageDelete = (index: number) => {
  //   const newPreview = preview.filter((_, i) => i !== index);
  //   setPreview(newPreview);
  // };

  // 이미지 삭제 핸들러
  const handleImageDelete = (id: string) => {
    setPreviewImages((prev) => {
      // 삭제할 이미지의 URL 객체를 해제
      const imageToDelete = prev.find((image) => image.id === id);
      if (imageToDelete?.kind === "Local") {
        URL.revokeObjectURL(imageToDelete.url);
        // 실제로 이미지 url이 제거됐는지 테스트하는 코드
        // handleTestRevoke(imageToDelete.url);
      }
      return prev.filter((image) => image.id !== id);
    });
  };

  const handleTestRevoke = (url: string) => {
    const img: HTMLImageElement = document.createElement("img");
    img.src = url;

    img.onload = () => {
      console.log("이미지 로드 성공:", url);
    };

    img.onerror = () => {
      console.log("이미지 로드 실패 (URL 해제됨):", url);
    };
  };

  const handleResetPreview = () => {
    setPreviewImages([...initialPreview]);
  };

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

  const onValid = async (data: UploadProductForm) => {
    if (isLoading) return;
    // 1. Cloudflare로 이미지 업로드 처리
    const updatedPreview = await handleImageUpload();
    // 2. 업로드된 이미지의 URL 또는 ID 배열 생성
    const images: CLImage[] = (updatedPreview || []).map((img) => ({
      imageId: img.CLurl || "", // undefined 방지를 위해 빈 문자열 처리
    }));
    if (images.length === 0) {
      toast.warn("이미지가 최소 1개 이상은 있어야 합니다.");
      return;
    }
    // 3. 상품 데이터와 함께 이미지 정보 전송
    const uploadProductData: UploadProduct = {
      ...data,
      images, // 이미지 정보 배열 포함
    };
    console.log("onValid 호출");
    mutate(uploadProductData);
  };

  // useEffect로 이미지 개수 감시 및 isDragEnabled 업데이트
  useEffect(() => {
    if (previewImages.length === 1) {
      setIsDragEnabled(false);
    }
    return () => {
      previewImages.forEach((image) => {
        if (image.kind === "Local") {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, [previewImages]);

  useEffect(() => {
    if (data?.ok) {
      // 업로드가 잘 되었다면 ....
      router.replace(`/products/${data.products.id}`);
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

  console.log("previewImages--------------: ", previewImages);

  return (
    <Layout seoTitle="상품 올리기" canGoBack title="상품 올리기" backUrl="back">
      <form className="space-y-4 p-4" onSubmit={handleSubmit(onValid)}>
        <DndContext
          sensors={sensors}
          collisionDetection={isDragEnabled ? closestCenter : undefined}
          onDragEnd={isDragEnabled ? handleDragEnd : undefined}
        >
          <div className="grid grid-cols-6 gap-4">
            <div className="flex flex-col gap-4">
              {/* 이미지 업로드 버튼 */}
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-md border border-gray-300">
                <label className="flex cursor-pointer flex-col items-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center">
                    <Image src="/images/camera.png" alt="Upload" width={30} height={30} />
                    <span className="mt-1 text-sm text-gray-600">
                      {previewImages.length}/{maxImages}
                    </span>
                  </div>
                </label>
              </div>
              {/* 탭 컨테이너 */}
              {previewImages.length > 1 && (
                <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md bg-gray-200 p-2">
                  {/* 프리뷰 이미지가 1개일 경우 "삭제하기"만 표시 */}
                  <>
                    {/* 프리뷰 이미지가 2개 이상일 경우 "순서변경"과 "삭제하기" 표시 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault(); // 이벤트 전파 방지
                        setIsDragEnabled(true);
                      }} // 드래그 모드 활성화
                      className={`w-full rounded-md px-1 py-2 text-xs ${
                        isDragEnabled
                          ? "border border-blue-500 bg-white text-blue-500"
                          : "text-gray-500"
                      }`}
                    >
                      순서변경
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault(); // 이벤트 전파 방지
                        setIsDragEnabled(false);
                      }} // 드래그 모드 비활성화
                      className={`w-full rounded-md px-1 py-2 text-xs ${
                        !isDragEnabled
                          ? "border border-blue-500 bg-white text-blue-500"
                          : "text-gray-500"
                      }`}
                    >
                      삭제하기
                    </button>
                  </>
                </div>
              )}
            </div>
            {/* 프리뷰 이미지 영역 */}
            <div className="col-span-5">
              <SortableContext
                items={previewImages.map((image) => image.id)} // 프리뷰 이미지의 id만 전달
                strategy={horizontalListSortingStrategy}
              >
                <div className="grid grid-cols-5 gap-4">
                  {previewImages.map((image, index) => {
                    return (
                      <SortableItem key={image.id} id={image.id}>
                        <div className="relative h-20 w-20 rounded-md border border-gray-300">
                          <Image
                            src={image.url}
                            alt={`Preview ${index}`}
                            layout="fill" // 부모 요소를 꽉 채움
                            objectFit="cover" // 부모 요소에 맞게 이미지 크기 조정
                            quality={75} // 이미지 품질
                            // sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // 반응형 크기
                            className="rounded-md" // 이미지 마스킹
                          />
                          {/* index가 0일 때 "대표사진" 표시 */}
                          {index === 0 && (
                            <div className="absolute bottom-0 left-0 w-full rounded-bl-md rounded-br-md bg-black py-1 text-center text-xs font-bold text-white">
                              대표사진
                            </div>
                          )}
                          {/* 삭제 버튼: isDragEnabled가 false일 때만 표시 */}
                          {!isDragEnabled && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleImageDelete(image.id);
                              }}
                              className="absolute right-0 top-0 z-10 flex h-6 w-6 translate-x-[50%] translate-y-[-50%] items-center justify-center rounded-full bg-black text-white shadow-lg"
                            >
                              <span className="relative top-[-1px] text-sm font-bold">×</span>
                            </button>
                          )}
                        </div>
                      </SortableItem>
                    );
                  })}
                </div>
              </SortableContext>
            </div>
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
