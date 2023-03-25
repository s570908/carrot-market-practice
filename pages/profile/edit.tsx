import Button from "@components/Button";
import Input from "@components/Input";
import Layout from "@components/Layout";
import type { NextPage } from "next";

const EditProfile: NextPage = () => {
  return (
    <Layout canGoBack>
      <div className="space-y-4 px-4 py-3">
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
          <Input label="Email Adress" name="email" type="email" required />
        </div>
        <div className="space-y-1">
          <Input label="Phone number" name="input" type="number" required />
        </div>
        <Button text="Update profile" />
      </div>
    </Layout>
  );
};

export default EditProfile;
