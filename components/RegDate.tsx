interface regDateProps {
  regDate: Date;
  [key: string]: any;
}

export default function RegDate({ regDate, ...rest }: regDateProps) {
  const date = new Date(regDate);
  return (
    <span
      {...rest}
    >{`${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`}</span>
  );
}
