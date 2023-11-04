import type { NextPage } from "next";
import Button from "@components/Button";
import Input from "@components/Input";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import { useForm } from "react-hook-form";
import useMutation from "@libs/client/useMutation";
import { useEffect, useState } from "react";
import { Product } from "@prisma/client";
import { useRouter } from "next/router";
import useUser from "@libs/client/useUser";

interface UploadProductForm {
  name: string;
  price: number;
  description: string;
  photo: FileList;
}

interface UploadProductMutation {
  ok: boolean;
  products: Product;
}

const Upload: NextPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const { register, handleSubmit, watch } = useForm<UploadProductForm>();
  const [uploadProduct, { loading, data }] = useMutation<UploadProductMutation>("/api/products");
  const onValid = async ({ name, price, description, photo }: UploadProductForm) => {
    if (loading) return;
    if (photo && photo.length > 0) {
      const { uploadURL } = await (await fetch(`/api/files`)).json(); // cloudflare에서 업로드할 url을 얻어온다.
      const form = new FormData();
      form.append("file", photo[0], name);  // form을 file 타입으로 만들고 photo[0]를 블랍(binary large object) 입력으로 사용하고 파일명을 name으로 사용한다.
      const {
        result: { id },
      } = await (
        await fetch(uploadURL, {
          method: "POST",
          body: form,
        })
      ).json();      // 이미지 폼을 uploadURL에 업로드한다. 업로드된 이미지의 URL을 id로 받는다.
      uploadProduct({ name, price, description, photoId: id }); // 이미지의 URL인 id를 name, price, description을 함께 backend에 기록한다.
    } else {
      uploadProduct({ name, price, description });
    }
    // if (photo && photo.length > 0) {
    //   console.log("phote, photo[0]: ", photo, photo[0]);
    //   const form = new FormData();

    //   // https://javascript.info/formdata
    //   /*       
    //   formData.append("image", imageBlob, "image.png");
      
    //   That’s same as if there were <input type="file" name="image"> in the form, 
    //   and the visitor submitted a file named "image.png" (3rd argument) with the data imageBlob (2nd argument) from their filesystem.
    //   The server reads form data and the file, as if it were a regular form submission. 
    //   */
    //   form.append("file", photo[0], name); // file: 타입, photo[0]: image blob, name: file name
    //   const result = await (
    //     await fetch("/api/images/file-upload", {
    //       method: "POST",
    //       body: form,
    //     })
    //   ).json();
    //   console.log("result: ", result);
    //   uploadProduct({ name, price, description, photoId: result.data.url });
    // } else {
    //   uploadProduct({ name, price, description });
    // }
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
      <form className="p-4 space-y-4" onSubmit={handleSubmit(onValid)}>
        <div>
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              className="object-contain w-full h-48 max-w-full text-gray-600 rounded-md aspect-video"
              alt="photo"
            />
          ) : (
            <label className="flex items-center justify-center w-full h-48 text-gray-600 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-orange-500 hover:text-orange-500">
              <svg
                className="w-12 h-12"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                {...register("photo", { required: true })}
                className="hidden"
                type="file"
                accept="image/*"
              />
            </label>
          )}
        </div>
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
        <Button text={loading ? "Loading" : "Upload item"} />
      </form>
    </Layout>
  );
};

export default Upload;
