import { useTranslation } from 'react-i18next';
import { isRTL } from '../i18n';

export const useRTL = () => {
  const { i18n } = useTranslation();
  const currentIsRTL = isRTL(i18n.language);

  return {
    isRTL: currentIsRTL,
    direction: currentIsRTL ? 'rtl' : 'ltr',
    
    // Text alignment utilities
    textAlign: {
      start: currentIsRTL ? 'right' : 'left',
      end: currentIsRTL ? 'left' : 'right',
      center: 'center'
    },
    
    // Margin utilities
    marginStart: (value: string | number) => 
      currentIsRTL ? { marginRight: value } : { marginLeft: value },
    marginEnd: (value: string | number) => 
      currentIsRTL ? { marginLeft: value } : { marginRight: value },
    
    // Padding utilities  
    paddingStart: (value: string | number) => 
      currentIsRTL ? { paddingRight: value } : { paddingLeft: value },
    paddingEnd: (value: string | number) => 
      currentIsRTL ? { paddingLeft: value } : { paddingRight: value },
    
    // Position utilities
    start: (value: string | number) => 
      currentIsRTL ? { right: value } : { left: value },
    end: (value: string | number) => 
      currentIsRTL ? { left: value } : { right: value },
    
    // Border utilities
    borderStart: (value: string) => 
      currentIsRTL ? { borderRight: value } : { borderLeft: value },
    borderEnd: (value: string) => 
      currentIsRTL ? { borderLeft: value } : { borderRight: value },
  };
}; 