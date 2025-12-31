import React, { createContext, useContext, useState, ReactNode } from "react";

interface BasicInfo {
    name: string;
    email: string;
    phone: string;
}

interface Verification {
    idUrl: string | null;
    selfieUrl: string | null;
}

interface Experience {
    years: string;
    description: string;
}

interface ProviderOnboardingContextType {
    basicInfo: BasicInfo;
    setBasicInfo: (info: BasicInfo) => void;
    selectedCategories: string[];
    setSelectedCategories: (categories: string[]) => void;
    verification: Verification;
    setVerification: (verification: Verification) => void;
    experience: Experience;
    setExperience: (experience: Experience) => void;
}

const ProviderOnboardingContext = createContext<ProviderOnboardingContextType | undefined>(undefined);

export function ProviderOnboardingProvider({ children }: { children: ReactNode }) {
    const [basicInfo, setBasicInfo] = useState<BasicInfo>({
        name: "",
        email: "",
        phone: "",
    });

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const [verification, setVerification] = useState<Verification>({
        idUrl: null,
        selfieUrl: null,
    });

    const [experience, setExperience] = useState<Experience>({
        years: "",
        description: "",
    });

    return (
        <ProviderOnboardingContext.Provider
            value={{
                basicInfo,
                setBasicInfo,
                selectedCategories,
                setSelectedCategories,
                verification,
                setVerification,
                experience,
                setExperience,
            }}
        >
            {children}
        </ProviderOnboardingContext.Provider>
    );
}

export function useProviderOnboarding() {
    const context = useContext(ProviderOnboardingContext);
    if (context === undefined) {
        throw new Error("useProviderOnboarding must be used within a ProviderOnboardingProvider");
    }
    return context;
}
