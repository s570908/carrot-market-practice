import Button from "@components/Button";
import Input from "@components/Input";
import { NextPage } from "next";
import { useForm } from "react-hook-form";

interface EditProfileForm {
  email?: string;
  phone?: string;
}

const EditProfile: NextPage = () => {
  const { register, watch, handleSubmit, reset } = useForm<EditProfileForm>();
  const onValid = (validForm: EditProfileForm) => {
    const { email, phone } = validForm;
    console.log("EditProfile--onValid, validForm :", validForm);
  };
  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4 px-4 py-10">
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
  );
};

export default EditProfile;
