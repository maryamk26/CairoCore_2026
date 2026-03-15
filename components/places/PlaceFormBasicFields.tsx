"use client";

import {
  PLACE_TYPES,
  PLACE_CATEGORIES,
  PLACE_VIBES,
  PLACE_TAGS,
  CITIES,
} from "@/lib/constants/places";
import { getPlaceFormClasses, type PlaceFormVariant } from "@/lib/places/placeFormStyles";

export interface PlaceFormBasicFieldsProps {
  variant: PlaceFormVariant;
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  type: string;
  onTypeChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  tags: string[];
  onTagsChange: (v: string[]) => void;
  vibes: string[];
  onVibesChange: (v: string[]) => void;
  address: string;
  onAddressChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
  latitude: string;
  onLatitudeChange: (v: string) => void;
  longitude: string;
  onLongitudeChange: (v: string) => void;
}

export default function PlaceFormBasicFields(props: PlaceFormBasicFieldsProps) {
  const {
    variant,
    name,
    onNameChange,
    description,
    onDescriptionChange,
    type,
    onTypeChange,
    category,
    onCategoryChange,
    tags,
    onTagsChange,
    vibes,
    onVibesChange,
    address,
    onAddressChange,
    city,
    onCityChange,
    latitude,
    onLatitudeChange,
    longitude,
    onLongitudeChange,
  } = props;
  const { labelCls, inputCls } = getPlaceFormClasses(variant);
  const isEdit = variant === "edit";

  const toggleTag = (value: string, checked: boolean) =>
    checked ? [...tags, value] : tags.filter((x) => x !== value);
  const toggleVibe = (value: string, checked: boolean) =>
    checked ? [...vibes, value] : vibes.filter((x) => x !== value);

  return (
    <>
      <div>
        <label className={`block text-sm font-medium mb-1 ${labelCls}`}>Title</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={isEdit ? undefined : "Add a title"}
          className={inputCls}
        />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1 ${labelCls}`}>Description</label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={isEdit ? undefined : "Add a detailed description"}
          rows={4}
          className={inputCls}
        />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1 ${labelCls}`}>Type</label>
        <select value={type} onChange={(e) => onTypeChange(e.target.value)} className={inputCls}>
          {PLACE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1 ${labelCls}`}>Category</label>
        <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className={inputCls}>
          <option value="">Choose a category</option>
          {PLACE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1 ${labelCls}`}>
          Tags {!isEdit && `(${tags.length})`}
        </label>
        <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-gray-300 bg-white min-h-[52px]">
          {PLACE_TAGS.map((t) => (
            <label key={t.value} className="inline-flex items-center gap-1.5 text-sm cursor-pointer text-gray-700">
              <input
                type="checkbox"
                checked={tags.includes(t.value)}
                onChange={(e) => onTagsChange(toggleTag(t.value, e.target.checked))}
                className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]"
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1 ${labelCls}`}>
          Vibes {!isEdit && `(${vibes.length})`}
        </label>
        <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-gray-300 bg-white min-h-[52px]">
          {PLACE_VIBES.map((v) => (
            <label key={v.value} className="inline-flex items-center gap-1.5 text-sm cursor-pointer text-gray-700">
              <input
                type="checkbox"
                checked={vibes.includes(v.value)}
                onChange={(e) => onVibesChange(toggleVibe(v.value, e.target.checked))}
                className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]"
              />
              {v.label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1 ${labelCls}`}>Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={isEdit ? undefined : "Add address"}
          className={inputCls}
        />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1 ${labelCls}`}>City</label>
        <select value={city} onChange={(e) => onCityChange(e.target.value)} className={inputCls}>
          {CITIES.map((c) => (
            <option key={c.value || "empty"} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-sm font-medium mb-1 ${labelCls}`}>Latitude *</label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => onLatitudeChange(e.target.value)}
            placeholder={isEdit ? undefined : "e.g. 30.0444"}
            className={inputCls}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${labelCls}`}>Longitude *</label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => onLongitudeChange(e.target.value)}
            placeholder={isEdit ? undefined : "e.g. 31.2357"}
            className={inputCls}
          />
        </div>
      </div>
    </>
  );
}
