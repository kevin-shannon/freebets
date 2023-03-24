import React, { useState, useEffect } from "react";
import { components } from "react-select";
import Select from "react-select";

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

const ValueContainer = ({ children, ...props }) => {
  const { getValue, hasValue } = props;
  const newChildren = [];
  const count = getValue().length;
  if (count === 1) {
    newChildren.push(getValue()[0]["label"]);
  } else if (props.options.length === count) {
    newChildren.push("All Books");
  } else {
    newChildren.push(`${count} books selected`);
  }
  newChildren.push(children[1]);

  if (!hasValue) {
    return <components.ValueContainer {...props}>{children}</components.ValueContainer>;
  }
  return <components.ValueContainer {...props}>{newChildren}</components.ValueContainer>;
};

const book_options = [
  { value: "betmgm", label: "BetMgm" },
  { value: "caesars", label: "Caesars" },
  { value: "draftkings", label: "Draftkings" },
  { value: "fanduel", label: "Fanduel" },
  { value: "pointsbet", label: "Pointsbet" },
  { value: "superbook", label: "Superbook" },
  { value: "unibet", label: "Unibet" },
];

function onBooksChange(input, onBookChange) {
  onBookChange.forEach((func) => {
    func(input);
  });
}

export default function BookSelect({ allowSelectAll, selectAllDefault, book, onBookChange }) {
  const selectAllOption = { label: "All", value: "all" };
  const [updatedOptions] = useState([selectAllOption, ...book_options]);
  useEffect(() => {
    onBooksChange(selectAllDefault ? (allowSelectAll ? updatedOptions : book_options) : [], onBookChange);
  }, [allowSelectAll, selectAllDefault, onBookChange, updatedOptions]);

  const handleSelectAll = (selectAll) => {
    selectAll ? (allowSelectAll ? onBooksChange(updatedOptions, onBookChange) : onBooksChange(book_options, onBookChange)) : onBooksChange([], onBookChange);
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
    <Select
      isMulti={true}
      components={{
        MultiValueContainer: () => null,
        Option,
        ValueContainer,
      }}
      hideSelectedOptions={false}
      closeMenuOnSelect={false}
      isSearchable={false}
      isClearable={false}
      options={allowSelectAll ? updatedOptions : book_options}
      value={book}
      onChange={handleChange}
    />
  );
}
