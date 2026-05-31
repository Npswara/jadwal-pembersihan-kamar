import { CLEANING_TASKS } from '../utils/constants';

export default function CleaningChecklist({ checked, onToggle }) {
  const doneCount = CLEANING_TASKS.filter((_, i) => checked[i]).length;

  return (
    <div className="cleaning-checklist">
      <h3 className="cleaning-checklist__title">Checklist Pembersihan</h3>
      <p className="cleaning-checklist__desc">
        Centang semua tugas berikut sebelum menyelesaikan pembersihan ({doneCount}/
        {CLEANING_TASKS.length} selesai).
      </p>
      <ul className="cleaning-checklist__list">
        {CLEANING_TASKS.map((task, index) => (
          <li key={task}>
            <label className={`cleaning-checklist__item${checked[index] ? ' cleaning-checklist__item--done' : ''}`}>
              <input
                type="checkbox"
                checked={!!checked[index]}
                onChange={() => onToggle(index)}
              />
              <span>{task}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
