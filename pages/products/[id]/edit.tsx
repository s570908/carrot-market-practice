import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Layout from "@components/Layout";
import Button from "@components/Button";
import Input from "@components/Input";
import TextArea from "@components/TextArea";
import { NextPage } from "next";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "react-toastify";

interface EditProductForm {
  name?: string;
  price?: number;
  description?: string;
  deletedImageIds?: string[];
  // photos: FileList;
}

interface PreviewImage {
  id: string; // 고유 ID 필드
  kind: "Local" | "Cloudflare";
  url: string;
  file?: File | null;
  CLurl?: string;
}

interface CLImage {
  imageId: string;
}

interface CloudflareImage {
  id: string;
  kind: "Cloudflare";
  url: string;
  CLurl: string;
}

interface EditProduct extends EditProductForm {
  images?: CLImage[];
}

interface ItemDetailResponse {
  ok: boolean;
  product: {
    name: string;
    price: number;
    description: string;
    images: CLImage[];
    // photoId: string;
  };
}

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

const EditProduct: NextPage = () => {
  const router = useRouter();
  const [photoPreview, setPhotoPreview] = useState("");

  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const maxImages = 10;
  const [isDragEnabled, setIsDragEnabled] = useState(true); // 드래그 모드 활성화
  const pointerSensor = useSensor(PointerSensor, {
    // 드래그 모드가 비활성화되었을 때 동작하지 않도록 설정
    activationConstraint: isDragEnabled ? undefined : { distance: 9999 },
  });
  const sensors = useSensors(pointerSensor); // sensors 설정
  const MAX_IMAGES = 10; // 최대 이미지 개수
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { dirtyFields },
  } = useForm<EditProductForm>();
  const {
    data: productData,
    isLoading: isLoadingProduct,
    isError,
  } = useQuery<ItemDetailResponse>(
    ["product", router?.query?.id],
    () => {
      // router.query.id가 없으면 Promise reject
      if (!router?.query?.id) {
        return Promise.reject(new Error("Product ID is required"));
      }
      return axios.get(`/api/products/${router.query.id}`).then((res) => res.data);
    },
    {
      enabled: Boolean(router?.query?.id),
      // 에러 발생시 재시도 옵션
      retry: 1,
      // 캐시 시간 설정
      staleTime: 30000,
    }
  );
  const updateProduct = async (
    // formData: UploadProductForm & { imageIds?: string[] }
    updateProduct: EditProduct
  ) => {
    const response = await axios.put(`/api/products/${router?.query?.id}`, updateProduct, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  };

  const {
    mutate,
    isLoading,
    data: mutationData,
  } = useMutation(updateProduct, {
    onSuccess: () => {
      console.log("onSuccess-----------: data", mutationData);
      // queryClient.invalidateQueries("products");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      console.log("handleFileChange clicked!!");
      console.log("files: ", files);

      // 현재 선택된 각 파일에 대해 중복 체크
      const duplicateFiles = files.filter((newFile) => {
        return previewImages.some((existingImage) => {
          if (existingImage.kind === "Local") {
            // 로컬 파일 비교
            return existingImage.file?.name === newFile.name;
          } else {
            // Cloudflare 이미지 URL과 파일명을 비교
            return existingImage.url === URL.createObjectURL(newFile);
          }
        });
      });

      // 중복된 파일 이름만 추출
      const duplicateFileNames = duplicateFiles.map((file) => file.name);

      // 중복된 파일이 있으면 toast 메시지 표시
      if (duplicateFileNames.length > 0) {
        toast.warn(`이미 추가된 이미지입니다: ${duplicateFileNames.join(", ")}`, {
          position: "top-center",
          autoClose: 3000,
          closeOnClick: true,
        });
      }

      // 중복되지 않은 파일만 필터링하여 처리
      const uniqueFiles = files.filter(
        (newFile) =>
          !previewImages.some((existingImage) => {
            if (existingImage.kind === "Local") {
              return existingImage.file?.name === newFile.name;
            } else {
              return existingImage.url === URL.createObjectURL(newFile);
            }
          })
      );

      if (uniqueFiles.length > 0) {
        const totalImages = previewImages.length + uniqueFiles.length;
        if (totalImages > maxImages) {
          toast.error(`이미지는 최대 ${maxImages}개까지 업로드 가능합니다.`);
          e.target.value = ""; // value 초기화
          return;
        }

        const newImages: PreviewImage[] = uniqueFiles.map((file, index) => ({
          id: `local-${Date.now()}-${index}`,
          kind: "Local",
          url: URL.createObjectURL(file),
          file,
        }));

        setPreviewImages((prev) => [...prev, ...newImages]);
      }

      // 선택 후 value 초기화
      e.target.value = "";
    }
  };

  const updatePreviewImages = async () => {
    // 1. 로컬 이미지와 Cloudflare 이미지를 분리
    const localImages = previewImages.filter((image) => image.kind === "Local");

    if (localImages.length === 0) {
      // 로컬 이미지가 없으면 현재 Cloudflare 이미지들만 반환
      return previewImages
        .filter((image) => image.kind === "Cloudflare")
        .filter((image) => !deletedImageIds.includes(image.CLurl!));
    }

    // 2. 로컬 이미지들 업로드
    const uploadedImages = await uploadImagesToCloudflare(localImages);

    // 3. 기존 Cloudflare 이미지 (삭제되지 않은 것들만) + 새로 업로드된 이미지
    return [
      ...previewImages.filter(
        (image) => image.kind === "Cloudflare" && !deletedImageIds.includes(image.CLurl!)
      ),
      ...uploadedImages,
    ];
  };

  // const updatePreviewImages = async () => {
  //   // 1. 로컬 이미지를 Cloudflare로 업로드
  //   const newCloudflareImages = await uploadImagesToCloudflare(previewImages);

  //   // 2. 기존 Cloudflare 이미지를 유지하고, 새로 업로드된 이미지를 병합
  //   const finalImages = [
  //     ...previewImages.filter((image) => image.kind === "Cloudflare"),
  //     ...newCloudflareImages,
  //   ];

  //   return finalImages;
  // };

  const handleImageDelete = (id: string) => {
    const imageToDelete = previewImages.find((image) => image.id === id);

    if (imageToDelete?.kind === "Cloudflare" && imageToDelete.CLurl) {
      // 삭제된 Cloudflare 이미지 ID 추가
      setDeletedImageIds((prev) => [...prev, imageToDelete.CLurl!]);
    }

    // previewImages에서 해당 이미지 제거
    setPreviewImages((prev) => {
      // 이미지 삭제 후 남은 이미지들
      const remainingImages = prev.filter((image) => image.id !== id);

      // 로컬 URL 정리
      if (imageToDelete && imageToDelete.kind === "Local" && imageToDelete.url) {
        URL.revokeObjectURL(imageToDelete.url);
      }

      return remainingImages;
    });
  };

  const deleteImageFromCloudflare = async (imageIds: string[]) => {
    try {
      const response = await axios.put("/api/cloudflare", { imageIds }); // 삭제 API 엔드포인트
      return response.data;
    } catch (error) {
      console.error("Cloudflare 이미지 삭제 실패:", error);
    }
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

  const uploadImagesToCloudflare = async (localImages: PreviewImage[]) => {
    try {
      // 1. 업로드 URL 요청
      const { uploadURLs } = await axios
        .get(`/api/files?count=${localImages.length}`)
        .then((res) => res.data);

      // const updatedImages: PreviewImage[] = [];

      // for (let i = 0; i < images.length; i++) {
      //   const image = images[i];
      //   const formData = new FormData();
      //   formData.append("file", image.file!); // 로컬 이미지 파일 추가

      //   // 2. 이미지 업로드
      //   const {
      //     data: {
      //       result: { id },
      //     },
      //   } = await axios.post(uploadURLs[i].uploadURL, formData);

      //   // 3. Cloudflare 이미지 생성
      //   updatedImages.push({
      //     id: image.id,
      //     kind: "Cloudflare",
      //     url: `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${id}/public`,
      //     file: null,
      //     CLurl: id,
      //   });
      // }

      const uploadPromises = localImages.map(async (image, index) => {
        const formData = new FormData();
        if (!image.file) throw new Error("파일이 없습니다.");
        formData.append("file", image.file);

        const {
          data: {
            result: { id },
          },
        } = await axios.post(uploadURLs[index].uploadURL, formData);

        return {
          id: image.id,
          kind: "Cloudflare" as const,
          url: `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${id}/public`,
          CLurl: id,
        };
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Cloudflare 업로드 실패:", error);
      throw error;
    }
  };

  // const onSubmit = async (data: EditProductForm) => {
  //   // 서버에 데이터를 업로드하는 로직을 구현합니다.
  //   console.log("상품 업데이트 데이터:", data);
  //   console.log("이미지 파일:", imageFiles);

  //   // 이후 서버로 이미지와 함께 데이터를 전송합니다.
  // };

  const onSubmit = async (data: EditProductForm) => {
    try {
      if (isLoading) return;

      // 이미지 유효성 검사를 먼저 수행
      if (previewImages.length === 0) {
        toast.error("이미지가 최소 1개 이상은 있어야 합니다.");
        return;
      }

      // 2. 기본 데이터 유효성 검사
      if (!data.name?.trim() || !data.price || !data.description?.trim()) {
        toast.error("모든 필수 항목을 입력해주세요.");
        return;
      }

      // 3. 기본 데이터 준비
      const editProductData = {
        name: data.name.trim(),
        price: Number(data.price),
        description: data.description.trim(),
      };

      // 4. 새로운 이미지만 Cloudflare에 업로드
      const localImages = previewImages.filter((img) => img.kind === "Local");
      let uploadedImages: { imageId: string }[] = [];

      if (localImages.length > 0) {
        const cloudflareUploadResult = await uploadImagesToCloudflare(localImages);
        uploadedImages = cloudflareUploadResult.map((img) => ({
          imageId: img.CLurl!,
        }));
      }

      // 5. 최종 이미지 목록 생성 (기존 이미지 + 새로 업로드된 이미지)
      const finalImages = [
        ...previewImages
          .filter((img) => img.kind === "Cloudflare")
          .map((img) => ({ imageId: img.CLurl! })),
        ...uploadedImages,
      ];

      // 최종 유효성 검사
      if (finalImages.length === 0) {
        toast.error("유효한 이미지가 없습니다. 다시 시도해주세요.");
        return;
      }

      // 최종 데이터 구성
      const finalProductData: EditProduct = {
        ...editProductData,
        images: finalImages,
        deletedImageIds, // 삭제 목록 포함
      };

      // 뮤테이션 실행
      mutate(finalProductData, {
        onError: (error) => {
          console.error("상품 수정 실패:", error);
          toast.error("상품 수정에 실패했습니다. 다시 시도해주세요.");
        },
        onSuccess: (data) => {
          toast.success("상품이 성공적으로 수정되었습니다.");
          // 성공 시 상품 상세 페이지로 이동
          if (data?.ok) {
            router.push(`/products/${router.query.id}`);
          }
        },
      });
    } catch (error) {
      console.error("폼 제출 중 오류 발생:", error);
      toast.error("예상치 못한 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  // useEffect로 이미지 개수 감시 및 isDragEnabled 업데이트
  useEffect(() => {
    if (previewImages.length === 1) {
      setIsDragEnabled(false);
    }
    // console.log("Updated previewImages:", previewImages);
  }, [previewImages.length]);

  // useEffect(() => {
  //   if (mutationData?.ok) {
  //     // 업로드가 잘 되었다면 ....
  //     router.push(`/products/${mutationData.products.id}`);
  //   }
  // }, [mutationData, router]);

  // const photos = watch("photos");

  // useEffect(() => {
  //   if (photos && photos.length > 0) {
  //     const file = photos[0];
  //     setPhotoPreview(URL.createObjectURL(file)); // 이미지 블랍인 file을 we will use this to show the preview of the image: blob
  //     // https://kyounghwan01.github.io/blog/JS/JSbasic/Blob-url/
  //     // URL.createObjectURL() 메소드는 주어진 객체를 가리키는 URL을 DOMString으로 변환하는 기능을 합니다.
  //     // 해당 url은 window 창이 사라지면 함께 사라집니다. 그에 따라 다른 window에서 재 사용이 불가능하고 이 URL은 수명이 한정되있습니다.
  //   }
  // }, [photos]);

  useEffect(() => {
    if (productData && productData?.ok) {
      // 데이터를 각 필드의 초기값으로 설정
      setValue("name", productData?.product.name);
      setValue("price", productData?.product.price);
      setValue("description", productData?.product.description);
      // if (data.product.photoId) {
      //   setPhotoPreview(`https://image-url/${data.product.photoId}`);
      // }
      // 기존 상태를 확인 후 초기화
      setPreviewImages((prev) => {
        if (prev.length > 0) {
          return prev; // 이미 값이 설정되어 있다면 초기화하지 않음
        }

        const newPreviewImages = productData?.product.images.map((image) => ({
          id: `cloudflare-${image.imageId}`,
          kind: "Cloudflare" as const,
          url: `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${image.imageId}/public`,
          file: null,
          CLurl: image.imageId,
        }));
        return newPreviewImages;
      });
      // setPreviewImages(
      //   productData?.product.images.map((image) => ({
      //     id: image.imageId,
      //     kind: "Cloudflare" as const,
      //     url: `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${image.imageId}/public`,
      //     file: null,
      //     CLurl: image.imageId,
      //   }))
      // );

      // 삭제된 이미지 ID 배열 초기화
      setDeletedImageIds([]);
    }
  }, [setValue, productData]);

  return (
    <Layout seoTitle="상품 수정" canGoBack title="상품 수정" backUrl="back">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
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
                      type="button"
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
                            priority={true}
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
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
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
