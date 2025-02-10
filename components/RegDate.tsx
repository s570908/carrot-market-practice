import dayjs from "@libs/dayjs";

interface regDateProps {
  regDate: Date;
  [key: string]: any;
}

export default function RegDate({ regDate, ...rest }: regDateProps) {
  const date = dayjs(new Date(regDate)).tz("Asia/Seoul");
  return <span {...rest}>{date.format("A h:mm")}</span>;
}
