export type Locale = "english" | "indonesia";

export type Feature = {
    id?: number;
    titleIdn: string;
    descriptionIdn: string;
    titleEn: string;
    descriptionEn: string;
    icon: string;
    iconPreview?: string;
    isOpen: boolean;
};

export type FeatureField =
    | "titleIdn"
    | "descriptionIdn"
    | "titleEn"
    | "descriptionEn";