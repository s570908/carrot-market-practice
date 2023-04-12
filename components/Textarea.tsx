interface TextAreaProps {
  name?: string;
  label?: string;
  [key: string]: any;
}

const TextArea = ({ name, label, ...rest }: TextAreaProps) => {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        {...rest}
        id={name}
        rows={4}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 "
      />
    </div>
  );
};

export default TextArea;
