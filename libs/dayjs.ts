import "dayjs/locale/ko";

import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import localeData from "dayjs/plugin/localeData";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.locale("ko");
dayjs.extend(localeData);
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export default dayjs;
