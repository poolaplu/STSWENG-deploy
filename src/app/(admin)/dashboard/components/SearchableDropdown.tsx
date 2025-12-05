"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "@/styles/searchable.module.css";

interface SearchableDropdownProps {
    options: { value: string; label: string }[];
    value: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    isMulti?: boolean;
    noResultsText?: string;
    disableSearch?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = "Search...",
    isMulti = true,
    noResultsText = "No results found",
    disableSearch = false,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options
        .filter((option) => !value.includes(option.value))
        .filter((option) =>
            String(option.label || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );

    const handleSelect = (selectedValue: string) => {
    if (isMulti) {
        onChange([...value, selectedValue]);
    } else {
        onChange([selectedValue]);
        setIsOpen(false);
    }
    setSearchTerm("");
};

    const removeItem = (itemToRemove: string) => {
        onChange(value.filter((item) => item !== itemToRemove));
    };

    return (
        <div className={styles["dropdown-container"]} ref={dropdownRef}>
            <div className={styles["dropdown-input"]}>
    <div className={styles["input-row"]}>
        {value.map((item) => {
            const label = options.find((opt) => opt.value === item)?.label || item;
            return (
                <span key={item} className={styles["selected-item"]}>
                    {label}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item);
                        }}
                    >
                        ×
                    </button>
                </span>
            );
        })}

        {!disableSearch && (
            <input
    type="text"
    value={searchTerm}
    onChange={(e) => {
    const newTerm = e.target.value;
    setSearchTerm(newTerm);
    setIsOpen(newTerm.trim() !== "");
}}
    onFocus={() => {
    if (searchTerm.trim() !== "") {
        setIsOpen(true);
    }
}}
    placeholder={value.length === 0 ? placeholder : ""}
    className={styles["search-input"]}
/>
        )}
    </div>
</div>


            {isOpen && !disableSearch && (
                <div className={styles["dropdown-menu"]}>
                    {filteredOptions.length === 0 ? (
                        <div className={styles["no-results"]}>{noResultsText}</div>
                    ) : (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`${styles["dropdown-item"]} ${value.includes(option.value) ? styles["selected"] : ""}`}
                                onClick={() => handleSelect(option.value)}>
                                {option.label}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
