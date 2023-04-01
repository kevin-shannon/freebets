import "./BookSelect.css";
import Select from "react-select";
import { components } from "react-select";
import { book_options_all, book_options } from "./Options";

const Option = (props) => {
  return (
    <div>
      <components.Option {...props}>
        <input type="checkbox" checked={props.isSelected} onChange={() => null} />
        <label>{props.label}</label>
      </components.Option>
    </div>
  );
};

const bookSelectStyle = {
  control: (base) => ({
    ...base,
    backgroundColor: "#fafafa",
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: "#fafafa",
    "::-webkit-scrollbar": {
      width: "4px",
      height: "0px",
    },
    "::-webkit-scrollbar-track": {
      background: "#f1f1f1",
    },
    "::-webkit-scrollbar-thumb": {
      background: "#888",
    },
    "::-webkit-scrollbar-thumb:hover": {
      background: "#555",
    },
  }),
  option: (base, _) => ({
    ...base,
    backgroundColor: null,
    color: null,
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
  }),
};

const ValueContainer = ({ children, ...props }) => {
  const { getValue, hasValue } = props;
  const newChildren = [];
  const count = getValue().length;
  if (count === 1) {
    newChildren.push(getValue()[0]["label"]);
  } else if (props.options.length === count) {
    newChildren.push("All Books");
  } else {
    newChildren.push(`${count} books`);
  }
  newChildren.push(children[1]);

  if (!hasValue) {
    return <components.ValueContainer {...props}>{children}</components.ValueContainer>;
  }
  return <components.ValueContainer {...props}>{newChildren}</components.ValueContainer>;
};

function onBooksChange(input, onBookChange) {
  onBookChange.forEach((func) => {
    func(input);
  });
}

export default function BookSelect({ allowSelectAll, book, onBookChange, helperText }) {
  const handleSelectAll = (selectAll) => {
    selectAll ? (allowSelectAll ? onBooksChange(book_options_all, onBookChange) : onBooksChange(book_options, onBookChange)) : onBooksChange([], onBookChange);
  };

  const handleChange = (selected, action) => {
    if (action.action === "select-option" && action.option.value === "all") {
      handleSelectAll(true);
    } else if (action.action === "deselect-option" && action.option.value === "all") {
      handleSelectAll(false);
    } else if (action.action === "select-option" && selected.length === book_options.length) {
      handleSelectAll(true);
    } else {
      if (action.action === "deselect-option" && selected.length === book_options.length) selected = selected.filter((obj) => obj.value !== "all");
      onBooksChange(selected, onBookChange);
    }
  };

  return (
    <div>
      <Select
        styles={bookSelectStyle}
        id={helperText}
        className="dropdown"
        isMulti={true}
        components={{
          MultiValueContainer: () => null,
          Option,
          ValueContainer,
        }}
        hideSelectedOptions={false}
        closeMenuOnSelect={false}
        blurInputOnSelect={false}
        isSearchable={false}
        isClearable={false}
        options={allowSelectAll ? book_options_all : book_options}
        value={book}
        onChange={handleChange}
      />
    </div>
  );
}
