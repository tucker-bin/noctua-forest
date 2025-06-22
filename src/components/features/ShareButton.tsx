import React, { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, Snackbar, Alert } from '@mui/material';
import { Share, Link, Twitter, Facebook, WhatsApp, ContentCopy } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { log } from '../../utils/logger';

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  title = 'Noctua Forest - Pattern Observatory',
  text = 'Discover hidden patterns in language through observation',
  url = window.location.href,
  variant = 'outlined',
  size = 'medium',
  className
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const handleClick = async (event: React.MouseEvent<HTMLElement>) => {
    // Try native Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        return;
      } catch (error) {
        // User cancelled or error occurred, fall back to custom menu
        log.info('Native share cancelled or failed:', { data: error });
      }
    }

    // Fallback to custom share menu
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
      setShowCopySuccess(true);
      handleClose();
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = `${title}\n${text}\n${url}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopySuccess(true);
      handleClose();
    }
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: <ContentCopy />,
      action: copyToClipboard
    },
    {
      name: 'Twitter',
      icon: <Twitter />,
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=NoctuaForest,PatternObservation,Language`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        handleClose();
      }
    },
    {
      name: 'Facebook',
      icon: <Facebook />,
      action: () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(`${title} - ${text}`)}`;
        window.open(facebookUrl, '_blank', 'noopener,noreferrer');
        handleClose();
      }
    },
    {
      name: 'WhatsApp',
      icon: <WhatsApp />,
      action: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n${text}\n${url}`)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        handleClose();
      }
    },
    {
      name: 'Email',
      icon: <Link />,
      action: () => {
        const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
        window.location.href = emailUrl;
        handleClose();
      }
    }
  ];

  return (
    <>
      <Button
        variant={variant}
        size={size}
        startIcon={<Share />}
        onClick={handleClick}
        className={className}
        sx={{
          textTransform: 'none',
          borderRadius: 2
        }}
      >
        {t('share.button', 'Share')}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        {shareOptions.map((option) => (
          <MenuItem
            key={option.name}
            onClick={option.action}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}>
              {option.icon}
            </ListItemIcon>
            <ListItemText>
              {t(`share.${option.name.toLowerCase().replace(' ', '_')}`, option.name)}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <Snackbar
        open={showCopySuccess}
        autoHideDuration={3000}
        onClose={() => setShowCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowCopySuccess(false)}>
          {t('share.copy_success', 'Link copied to clipboard!')}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareButton; 