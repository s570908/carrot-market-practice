interface TextAreaProps {
  name?: string;
  label?: string;
  [key: string]: any;
}

const TextArea = ({ name, label, ...rest }: TextAreaProps) => {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <textarea
        {...rest}
        id={name}
        rows={4}
        className="focus:border-1 mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
      />
    </div>
  );
};

export default TextArea;
