import dayjs from "@libs/dayjs";

interface regDateProps {
  regDate: Date;
  [key: string]: any;
}

export default function RegDate({ regDate, ...rest }: regDateProps) {
  const date = dayjs(new Date(regDate)).tz("Asia/Seoul");

  return (
    <span {...rest}>{`${date.year()}-${
      date.month() + 1
    }-${date.date()} ${date.hour()}:${date.minute()}:${date.second()}`}</span>
  );
}
