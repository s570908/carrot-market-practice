import type { NextPage } from "next";
import Button from "@components/Button";
import Input from "@components/Input";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import gravatar from "gravatar";
import { useMutation } from "@tanstack/react-query";
import { EditProfileForm, EditProfileResponse } from "@/types";
import { updateMe } from "@/apiLibs/users";
import { toast } from "react-toastify";

const EditProfile: NextPage = () => {
  const { user, mutate: mutateUser } = useUser();
  const {
    register,
    setValue,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    console.log("EditProfile--user?.avatar: ", user?.avatar);
    if (user?.name) setValue("name", user.name);
    if (user?.email) setValue("email", user.email);
    if (user?.phone) setValue("phone", user.phone);
    if (user?.avatar) {
      setAvatarPreview(
        `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${user?.avatar}/public`
      );
    } else {
      setAvatarPreview(
        `https:${gravatar.url(user?.email ? user?.email : "anonymous@email.com", {
          s: "48px",
          d: "retro",
        })}`
      );
    }
  }, [user, setValue]);

  const {
    mutate: editProfile,
    data,
    isPending: loading,
  } = useMutation({
    mutationFn: updateMe,
    onError: (error: any) => {
      console.error("프로필 업데이트 중 오류 발생:", error);
      toast.error("프로필 업데이트에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const onValid = async ({ email, phone, name, avatar }: EditProfileForm) => {
    console.log("pages/profile/edit: email, name, phone, avatar: ", email, name, phone, avatar);
    if (loading) return;
    if (email === "" && phone === "" && name === "") {
      return setError("formErrors", {
        message: "뭐든 하나는 써라.",
      });
    }
    if (avatar && avatar.length > 0 && user) {
      const result = await (await fetch(`/api/files`)).json();
      const { uploadURL } = result;
      console.log("avatar, uploadURL: ", avatar, uploadURL);
      const form = new FormData();
      form.append("file", avatar[0], user?.id + "");
      const {
        result: { id },
      } = await (
        await fetch(uploadURL, {
          method: "POST",
          body: form,
        })
      ).json();
      editProfile({ email, phone, name, avatarId: id });
    } else {
      editProfile({ email, phone, name });
    }
  };

  useEffect(() => {
    if (data && !data.ok && data.error) {
      setError("formErrors", { message: data.error });
    }
  }, [data, setError]);

  const [avatarPreview, setAvatarPreview] = useState("");
  const avatar = watch("avatar");
  useEffect(() => {
    if (avatar && avatar.length > 0) {
      const file = avatar[0];
      setAvatarPreview(URL.createObjectURL(file));
    }
  }, [avatar]);

  return (
    <Layout seoTitle="프로필 수정" canGoBack title="프로필 수정" backUrl={"/profile"}>
        <form onSubmit={handleSubmit(onValid)} className="px-4 py-10 space-y-4">
          <div className="flex items-center space-x-3">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                className="rounded-full h-14 w-14 bg-slate-500"
                alt="avatarPreview"
              />
            ) : (
              <div className="rounded-full h-14 w-14 bg-slate-500" />
            )}
            <label
              htmlFor="picture"
              className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Change
              <input
                {...register("avatar")}
                id="picture"
                type="file"
                className="hidden"
                accept="image/*"
              />
            </label>
          </div>
          <Input
            register={register("name", { required: false })}
            label="Name"
            name="name"
            type="text"
          />
          <Input
            register={register("email", { required: false })}
            label="Email address"
            name="email"
            type="email"
          />
          <Input
            register={register("phone", { required: false })}
            label="Phone number"
            name="phone"
            type="number"
            kind="phone"
          />
          {errors.formErrors && (
            <span className="block font-bold text-center text-red-600">
              {`${errors.formErrors.message}`}
            </span>
          )}
          <Button text={loading ? "Loading..." : "Update profile"} />
        </form>
    </Layout>
  );
};

export default EditProfile;
