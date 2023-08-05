import Button from "@components/Button";
import Input from "@components/Input";
import Layout from "@components/Layout";
import useMutation from "@libs/client/useMutation";
import type { NextPage } from "next";
import { useForm } from "react-hook-form";

interface EditprofileForm {
  name?: string;
  phone?: string;
  email?: string;
}

const EditProfile: NextPage = () => {
  const { register, handleSubmit } = useForm<EditprofileForm>();
  const [editProfile, { data, loading, error }] = useMutation("/api/users/me");

  const onValid = (validForm: EditprofileForm) => {
    const { name, email, phone } = validForm;
    console.log("EditProfile----name, email, phone: ", name, email, phone);
    editProfile({ name, email, phone });
  };

  return (
    <Layout canGoBack>
      <form onSubmit={handleSubmit(onValid)} className="space-y-4 px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="h-14 w-14 rounded-full bg-slate-400" />
          <label
            htmlFor="picture"
            className="cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Change photo
            <input id="picture" type="file" className="hidden" accept="image/*"></input>
          </label>
        </div>
        <div className="space-y-1">
          <Input
            register={register("name", { required: "Name is required." })}
            label="Name"
            name="name"
            type="text"
          />
        </div>
        <div className="space-y-1">
          <Input
            register={register("email", { required: "Email is required." })}
            label="Email Adress"
            name="email"
            type="email"
          />
        </div>
        <div className="space-y-1">
          <Input
            register={register("phone", { required: "Phone number is required." })}
            label="Phone number"
            name="input"
            type="number"
            kind="phone"
          />
        </div>
        <Button text="Update profile" />
      </form>
    </Layout>
  );
};

export default EditProfile;

/* 
import Button from "@components/Button";
import Input from "@components/Input";
import Layout from "@components/Layout";
import useMutation from "@libs/client/useMutation";
import { NextPage } from "next";
import { useForm } from "react-hook-form";

interface EditProfileForm {
  email?: string;
  phone?: string;
  name?: string;
}

const EditProfile: NextPage = () => {
  const [editProfile, { data, loading, error }] = useMutation("/api/users/me");
  const { register, watch, handleSubmit, reset } = useForm<EditProfileForm>();
  const onValid = (validForm: EditProfileForm) => {
    const { email, phone, name } = validForm;
    console.log("EditProfile--onValid, validForm :", validForm);
    editProfile({ email, phone, name });
  };
  return (
    <Layout canGoBack title="Edit Profile">
      <form onSubmit={handleSubmit(onValid)} className="px-4 py-10 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="rounded-full h-14 w-14 bg-slate-400" />
          <label
            htmlFor="picture"
            className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md shadow-sm cursor-pointer focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Change photo
            <input id="picture" type="file" className="hidden" accept="image/*"></input>
          </label>
        </div>
        <Input
          register={register("name", { required: "Name is required." })}
          label="Name"
          name="name"
          kind="text"
          type="text"
        />
        <Input
          register={register("email", { required: "Email is required." })}
          label="Email Address"
          name="email"
          kind="text"
          type="email"
        />
        <Input
          register={register("phone", { required: "Phone number is required." })}
          label="Phone number"
          name="phone"
          kind="phone"
          type="number"
        />
        <Button text="Update profile" />
      </form>
    </Layout>
  );
};

export default EditProfile; 
*/
