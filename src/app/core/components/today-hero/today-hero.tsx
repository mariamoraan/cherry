import { formatGreeting } from "@/core/cycle/dates";
import { cx } from "@/core/lib/cx";

import styles from "./today-hero.module.scss";

type TodayHeroProps = {
  firstName: string | null;
  periodDay: number | null;
  cycleDay: number | null;
  selectedDate: string;
  today: string;
};

export function TodayHero({
  firstName,
  periodDay,
  cycleDay,
  selectedDate,
  today,
}: TodayHeroProps) {
  return (
    <div className={styles.todayHero}>
      <h1
        className={cx(
          styles.todayHero__status,
          !periodDay && styles["todayHero__status--quiet"],
        )}
      >
        {statusLabel(periodDay, cycleDay)}
      </h1>
      <p className={styles.todayHero__greeting}>
        {formatGreeting(firstName, selectedDate, today)}
      </p>
    </div>
  );
}

function statusLabel(periodDay: number | null, cycleDay: number | null): string {
  if (periodDay != null) return `Día de periodo ${periodDay}`;
  if (cycleDay != null) return `Día ${cycleDay} del ciclo`;
  return "Empieza a registrar";
}
