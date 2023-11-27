import dayjs from "@libs/dayjs";

interface CreatedAtProps {
  date?: Date | string;
  size: string;
  style?: string;
}

const CreatedAt = ({ date, size, style }: CreatedAtProps) => {
  const dateKST = dayjs(new Date(String(date))).tz("Asia/Seoul");
  const relDate = dateKST.fromNow();
  const parsedCreatedAt: string = relDate || "방금 전";
  return <span className={`${size} ${style} text-gray-400`}>{parsedCreatedAt}</span>;
};

export default CreatedAt;
