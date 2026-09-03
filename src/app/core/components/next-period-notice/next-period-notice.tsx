import {
  formatNextPeriodNotice,
  type PeriodPrediction,
} from "@/core/cycle/prediction";

import styles from "./next-period-notice.module.scss";

type NextPeriodNoticeProps = {
  prediction: PeriodPrediction;
};

export function NextPeriodNotice({ prediction }: NextPeriodNoticeProps) {
  return (
    <p className={styles.nextPeriodNotice} role="status">
      <span className={styles.nextPeriodNotice__label}>Próxima regla</span>
      <span className={styles.nextPeriodNotice__copy}>
        {formatNextPeriodNotice(prediction)}
      </span>
    </p>
  );
}
