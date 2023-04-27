import React, {ReactNode} from "react";
import "./BookSelect.css";
import Select, { components, MultiValue, ActionMeta, ValueContainerProps, OptionProps, GroupBase } from "react-select";
import { book_options_all, book_options } from "../../Options";
import { BookOption } from "../../enums";

const Option = (props: OptionProps<BookOption>) => {
  return (
    <div>
      <components.Option {...props}>
        <input type="checkbox" checked={props.isSelected} onChange={() => null} />
        <label>{props.label}</label>
      </components.Option>
    </div>
  );
};

interface BetTypeStyle {
  control: (base: any) => any;
  menuList: (base: any) => any;
  option: (base: any, _: any) => any;
}

const bookSelectStyle: BetTypeStyle = {
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

const ValueContainer = ({ children, ...props }: ValueContainerProps<BookOption>) => {
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

  if (!hasValue) {
    return <components.ValueContainer {...props}>{children}</components.ValueContainer>;
  }
  return <components.ValueContainer {...props}>{newChildren}</components.ValueContainer>;
};

function onBooksChange(input: BookOption[], onBookChange: React.Dispatch<React.SetStateAction<BookOption[]>>[]) {
  onBookChange.forEach((func) => {
    func(input);
  });
}

interface BookSelectProps {
  id: string;
  allowSelectAll: boolean;
  book: BookOption[];
  onBookChange: React.Dispatch<React.SetStateAction<BookOption[]>>[];
}

export default function BookSelect({ id, allowSelectAll, book, onBookChange }: BookSelectProps) {
  const handleSelectAll = (selectAll: boolean) => {
    selectAll ? (allowSelectAll ? onBooksChange(book_options_all, onBookChange) : onBooksChange(book_options, onBookChange)) : onBooksChange([], onBookChange);
  };

  const handleChange = (selected: MultiValue<BookOption>, action: ActionMeta<BookOption>) => {
    if (action.action === "select-option" && action.option && action.option.value === "all") {
      handleSelectAll(true);
    } else if (action.action === "deselect-option" && action.option &&  action.option.value === "all") {
      handleSelectAll(false);
    } else if (action.action === "select-option" && selected.length === book_options.length) {
      handleSelectAll(true);
    } else {
      if (action.action === "deselect-option" && selected.length === book_options.length) 
      selected = selected.filter((obj) => obj.value !== "all");
      const multiValueSelected = selected.map(option => ({ value: option.value, label: option.label }));
      onBooksChange(multiValueSelected, onBookChange);
    }
  };

  return (
    <div>
      <Select
        styles={bookSelectStyle}
        id={id}
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