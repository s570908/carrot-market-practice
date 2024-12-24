// import type { NextPage } from "next";
// import Button from "@components/Button";
// import Input from "@components/Input";
// import Layout from "@components/Layout";
// import TextArea from "@components/TextArea";
// import { useForm } from "react-hook-form";
// import useMutation from "@libs/client/useMutation";
// import { useEffect, useState } from "react";
// import { Product } from "@prisma/client";
// import { useRouter } from "next/router";
// import useUser from "@libs/client/useUser";

// interface UploadProductForm {
//   name: string;
//   price: number;
//   description: string;
//   photo: FileList;
// }

// interface UploadProductMutation {
//   ok: boolean;
//   products: Product;
// }

// const Upload: NextPage = () => {
//   const { user } = useUser();
//   const router = useRouter();
//   const { register, handleSubmit, watch } = useForm<UploadProductForm>();
//   const [uploadProduct, { loading, data }] =
//     useMutation<UploadProductMutation>("/api/products");
//   const onValid = async ({
//     name,
//     price,
//     description,
//     photo,
//   }: UploadProductForm) => {
//     if (loading) return;
//     if (photo && photo.length > 0) {
//       const { uploadURL } = await (await fetch(`/api/files`)).json(); // cloudflare에서 업로드할 url을 얻어온다.
//       const form = new FormData();
//       form.append("file", photo[0], name); // form을 file 타입으로 만들고 photo[0]를 블랍(binary large object) 입력으로 사용하고 파일명을 name으로 사용한다.
//       const {
//         result: { id },
//       } = await (
//         await fetch(uploadURL, {
//           method: "POST",
//           body: form,
//         })
//       ).json(); // 이미지 폼을 uploadURL에 업로드한다. 업로드된 이미지의 URL을 id로 받는다.
//       uploadProduct({ name, price, description, photoId: id }); // 이미지의 URL인 id를 name, price, description을 함께 backend에 기록한다.
//     } else {
//       uploadProduct({ name, price, description });
//     }
//     // if (photo && photo.length > 0) {
//     //   console.log("phote, photo[0]: ", photo, photo[0]);
//     //   const form = new FormData();

//     //   // https://javascript.info/formdata
//     //   /*
//     //   formData.append("image", imageBlob, "image.png");

//     //   That’s same as if there were <input type="file" name="image"> in the form,
//     //   and the visitor submitted a file named "image.png" (3rd argument) with the data imageBlob (2nd argument) from their filesystem.
//     //   The server reads form data and the file, as if it were a regular form submission.
//     //   */
//     //   form.append("file", photo[0], name); // file: 타입, photo[0]: image blob, name: file name
//     //   const result = await (
//     //     await fetch("/api/images/file-upload", {
//     //       method: "POST",
//     //       body: form,
//     //     })
//     //   ).json();
//     //   console.log("result: ", result);
//     //   uploadProduct({ name, price, description, photoId: result.data.url });
//     // } else {
//     //   uploadProduct({ name, price, description });
//     // }
//   };
//   useEffect(() => {
//     if (data?.ok) {
//       // 업로드가 잘 되었다면 ....
//       router.push(`/products/${data.products.id}`);
//     }
//   }, [data, router]);
//   const photo = watch("photo");
//   const [photoPreview, setPhotoPreview] = useState("");
//   useEffect(() => {
//     if (photo && photo.length > 0) {
//       const file = photo[0];
//       setPhotoPreview(URL.createObjectURL(file)); // 이미지 블랍인 file을 we will use this to show the preview of the image: blob
//       // https://kyounghwan01.github.io/blog/JS/JSbasic/Blob-url/
//       // URL.createObjectURL() 메소드는 주어진 객체를 가리키는 URL을 DOMString으로 변환하는 기능을 합니다.
//       // 해당 url은 window 창이 사라지면 함께 사라집니다. 그에 따라 다른 window에서 재 사용이 불가능하고 이 URL은 수명이 한정되있습니다.
//     }
//   }, [photo]);
//   return (
//     <Layout seoTitle="상품 올리기" canGoBack title="상품 올리기" backUrl="back">
//       <form className="p-4 space-y-4" onSubmit={handleSubmit(onValid)}>
//         <div>
//           {photoPreview ? (
//             // eslint-disable-next-line @next/next/no-img-element
//             <img
//               src={photoPreview}
//               className="object-contain w-full h-48 max-w-full text-gray-600 rounded-md aspect-video"
//               alt="photo"
//             />
//           ) : (
//             <label className="flex items-center justify-center w-full h-48 text-gray-600 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-orange-500 hover:text-orange-500">
//               <svg
//                 className="w-12 h-12"
//                 stroke="currentColor"
//                 fill="none"
//                 viewBox="0 0 48 48"
//                 aria-hidden="true"
//               >
//                 <path
//                   d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
//                   strokeWidth={2}
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//               <input
//                 {...register("photo", { required: true })}
//                 className="hidden"
//                 type="file"
//                 accept="image/*"
//               />
//             </label>
//           )}
//         </div>
//         <Input
//           register={register("name", { required: true })}
//           label="Name"
//           name="name"
//           type="text"
//         />
//         <Input
//           register={register("price", { required: true })}
//           label="Price"
//           placeholder="0"
//           name="price"
//           type="number"
//           kind="price"
//         />
//         <TextArea
//           register={register("description", { required: true })}
//           name="description"
//           label="Description"
//         />
//         <Button text={loading ? "Loading" : "Upload item"} />
//       </form>
//     </Layout>
//   );
// };

// export default Upload;

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Layout from "@components/Layout";
import Button from "@components/Button";
import Input from "@components/Input";
import TextArea from "@components/TextArea";
import { NextPage } from "next";
import Image from "next/image";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import axios from "axios";
import cameraIcon from "public/images/camera.png";
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

interface EditProductForm {
  name: string;
  price: number;
  description: string;
  photos: FileList;
}

interface ItemDetailResponse {
  ok: boolean;
  product: {
    name: string;
    price: number;
    description: string;
    photoId: string;
  };
}

const EditProduct: NextPage = () => {
  const router = useRouter();
  const [photoPreview, setPhotoPreview] = useState("");
  // const [previewImages, setPreviewImages] = useState<string[]>(initialImages); // 기존 사진 포함 배열
  const [images, setImages] = useState<string[]>([]); // 이미지 URL 배열
  const [imageFiles, setImageFiles] = useState<File[]>([]); // 이미지 파일 배열
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null);
  const [isDragEnabled, setIsDragEnabled] = useState(true); // 드래그 모드 활성화
  const sensors = useSensors(useSensor(PointerSensor)); // PointerSensor 사용
  const MAX_IMAGES = 10; // 최대 이미지 개수
  const { register, handleSubmit, setValue, watch } =
    useForm<EditProductForm>();
  const { data } = useQuery<ItemDetailResponse>(
    ["product", router?.query?.id],
    () =>
      axios.get(`/api/products/${router?.query?.id}`).then((res) => res.data),
    {
      enabled: !!router?.query?.id,
      onSuccess: (data) => {
        if (data.ok) {
          // 데이터를 각 필드의 초기값으로 설정
          setValue("name", data.product.name);
          setValue("price", data.product.price);
          setValue("description", data.product.description);
          if (data.product.photoId) {
            setPhotoPreview(`https://image-url/${data.product.photoId}`);
          }
        }
      },
    }
  );

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    const newFiles = Array.from(files);

    if (images.length + newImages.length <= MAX_IMAGES) {
      setImages((prev) => [...prev, ...newImages]);
      setImageFiles((prev) => [...prev, ...newFiles]);
    } else {
      alert(`최대 ${MAX_IMAGES}개의 이미지만 업로드할 수 있습니다.`);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    if (mainImageIndex === index) {
      setMainImageIndex(null);
    } else if (mainImageIndex && mainImageIndex > index) {
      setMainImageIndex(mainImageIndex - 1);
    }
  };

  const setMainImage = (index: number) => {
    setMainImageIndex(index);
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

  const onSubmit = async (data: EditProductForm) => {
    // 서버에 데이터를 업로드하는 로직을 구현합니다.
    console.log("상품 업데이트 데이터:", data);
    console.log("이미지 파일:", imageFiles);

    // 이후 서버로 이미지와 함께 데이터를 전송합니다.
  };

  const photos = watch("photos");

  useEffect(() => {
    if (photos && photos.length > 0) {
      const file = photos[0];
      setPhotoPreview(URL.createObjectURL(file)); // 이미지 블랍인 file을 we will use this to show the preview of the image: blob
      // https://kyounghwan01.github.io/blog/JS/JSbasic/Blob-url/
      // URL.createObjectURL() 메소드는 주어진 객체를 가리키는 URL을 DOMString으로 변환하는 기능을 합니다.
      // 해당 url은 window 창이 사라지면 함께 사라집니다. 그에 따라 다른 window에서 재 사용이 불가능하고 이 URL은 수명이 한정되있습니다.
    }
  }, [photos]);

  return (
    <Layout seoTitle="상품 수정" canGoBack title="상품 수정">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
        <DndContext
          sensors={isDragEnabled ? sensors : []}
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
              {previewImages.length > 0 && (
                <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md bg-gray-200 p-2">
                  {/* 프리뷰 이미지가 1개일 경우 "삭제하기"만 표시 */}
                  {previewImages.length === 1 ? (
                    <button
                      onClick={() => setIsDragEnabled(false)} // 삭제 모드
                      className="w-full rounded-md border border-blue-500 bg-white px-1 py-2 text-xs text-blue-500"
                    >
                      삭제하기
                    </button>
                  ) : (
                    <>
                      {/* 프리뷰 이미지가 2개 이상일 경우 "순서변경"과 "삭제하기" 표시 */}
                      <button
                        onClick={() => setIsDragEnabled(true)} // 드래그 모드 활성화
                        className={`w-full rounded-md px-1 py-2 text-xs ${
                          isDragEnabled
                            ? "border border-blue-500 bg-white text-blue-500"
                            : "text-gray-500"
                        }`}
                      >
                        순서변경
                      </button>
                      <button
                        onClick={() => setIsDragEnabled(false)} // 드래그 모드 비활성화
                        className={`w-full rounded-md px-1 py-2 text-xs ${
                          !isDragEnabled
                            ? "border border-blue-500 bg-white text-blue-500"
                            : "text-gray-500"
                        }`}
                      >
                        삭제하기
                      </button>
                    </>
                  )}
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
                    console.log("image----------", image);
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
                            <div className="absolute bottom-0 left-0 z-20 flex h-6 w-full items-center justify-center bg-black text-xs font-bold text-white">
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
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              className="absolute right-0 top-0 z-10 flex h-6 w-6 translate-x-[50%] translate-y-[-50%] items-center justify-center rounded-full bg-black text-white shadow-lg"
                            >
                              <span className="relative top-[-1px] text-sm font-bold">
                                ×
                              </span>
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
        />
        <TextArea
          register={register("description", { required: true })}
          name="description"
          label="Description"
        />

        <Button text="Update item" />
      </form>
    </Layout>
  );
};

export default EditProduct;
