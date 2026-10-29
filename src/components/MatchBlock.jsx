import { Link } from 'react-router-dom';
import { SKILL_LEVELS } from '../labels.js';

export const matchSummaryText = (s) =>
  `${s.requiredMatched} из ${s.requiredTotal} обязательных · ${s.niceToHaveMatched} из ${s.niceToHaveTotal} желательных`;

const level = (value) => (value ? SKILL_LEVELS[value].toLowerCase() : '');

function Item({ item }) {
  const ok = item.status === 'MATCHED';
  let detail = '';
  if (item.status === 'MISSING') detail = '— нет в профиле';
  else if (item.minimumLevel) detail = `— уровень ${level(item.userLevel)}, требуется ${level(item.minimumLevel)}`;
  else if (item.userLevel) detail = `— уровень ${level(item.userLevel)}`;

  return (
    <li className={ok ? 'match__item match__item--ok' : 'match__item match__item--fail'}>
      <span aria-hidden="true">{ok ? '✓' : '✕'}</span> {item.skill} <span className="muted">{detail}</span>
    </li>
  );
}

/** Объяснимое соответствие роли (RULE-MATCH-01…06): по навыкам, без процентов. */
export default function MatchBlock({ match }) {
  if (!match.profileHasSkills) {
    return (
      <div className="match">
        <strong>Соответствие роли</strong>
        <p className="muted small">
          В профиле нет навыков — сравнивать не с чем. <Link to="/profile">Заполнить профиль</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="match">
      <strong>Соответствие роли</strong>
      {match.required.length > 0 && (
        <>
          <span className="match__group">Обязательные навыки</span>
          <ul className="match__list">
            {match.required.map((i) => (
              <Item key={i.skillId} item={i} />
            ))}
          </ul>
        </>
      )}
      {match.niceToHave.length > 0 && (
        <>
          <span className="match__group">Желательные навыки</span>
          <ul className="match__list">
            {match.niceToHave.map((i) => (
              <Item key={i.skillId} item={i} />
            ))}
          </ul>
        </>
      )}
      <div className="match__footer">
        <strong>Итог: {matchSummaryText(match.summary)}</strong>
        {match.roleTypeMatchesInterest && <span className="text-ok small">Роль совпадает с интересующей</span>}
      </div>
    </div>
  );
}
