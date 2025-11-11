import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fa' ? 'en' : 'fa';
    i18n.changeLanguage(newLang);
    document.dir = newLang === 'fa' ? 'rtl' : 'ltr';
  };

  return (
    <button
      onClick={toggleLanguage}
      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
      data-testid="language-switcher"
    >
      {i18n.language === 'fa' ? 'EN' : 'فا'}
    </button>
  );
};

export default LanguageSwitcher;
