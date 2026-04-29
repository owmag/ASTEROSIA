type Props = {
  categories: string[];
  rows?: string[][];
  selected: string | null;
  onSelect: (category: string | null) => void;
};

type Entry = string | null; // null = "All"

export function CategoryNav({ categories, rows, selected, onSelect }: Props) {
  const categoryRows = rows
    ? rows.map((row) => row.filter((category) => categories.includes(category)))
    : [categories];
  const navRows: Entry[][] = [[null, ...categoryRows[0]], ...categoryRows.slice(1)];

  const rowBtn = (cat: Entry) => {
    const isAll = cat === null;
    const isActive = isAll ? selected === null : selected === cat;
    return (
      <li className="category-nav__item" key={isAll ? "all" : cat}>
        <button
          type="button"
          className={"category-nav__btn" + (isActive ? " is-active" : "")}
          onClick={() => onSelect(isAll ? null : cat)}
          aria-pressed={isActive}
        >
          {isAll ? "All" : cat}
        </button>
      </li>
    );
  };

  return (
    <nav className="category-nav" aria-label="Categories">
      {navRows.map((row, index) => (
        <ul className="category-nav__row" role="list" key={index}>
          {row.map((cat) => rowBtn(cat))}
        </ul>
      ))}
    </nav>
  );
}
