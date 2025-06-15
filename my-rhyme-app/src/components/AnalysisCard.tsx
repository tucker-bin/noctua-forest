import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Button,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Drafts as DraftIcon,
} from '@mui/icons-material';
import type { AnalysisPost } from '../types/analysis';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface AnalysisCardProps {
  analysis: AnalysisPost;
  onOpen: (analysis: AnalysisPost) => void;
  onEdit?: (analysis: AnalysisPost) => void;
  onDelete?: (analysisId: string) => void;
  onLike?: (analysisId: string) => void;
  onShare?: (analysis: AnalysisPost) => void;
  showAuthor?: boolean;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({
  analysis,
  onOpen,
  onEdit,
  onDelete,
  onLike,
  onShare,
  showAuthor = false
}) => {
  const { currentUser } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLiked, setIsLiked] = useState(analysis.isLiked || false);

  const isOwner = currentUser?.uid === analysis.userId;
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLike = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onLike) {
      onLike(analysis.id);
      setIsLiked(!isLiked);
    }
  };

  const handleShare = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onShare) {
      onShare(analysis);
    }
  };

  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) {
      onEdit(analysis);
    }
  };

  const handleDelete = () => {
    handleMenuClose();
    if (onDelete && window.confirm('Are you sure you want to delete this analysis?')) {
      onDelete(analysis.id);
    }
  };

  const getPreviewText = () => {
    return analysis.originalText.length > 150 
      ? analysis.originalText.substring(0, 150) + '...'
      : analysis.originalText;
  };

  const getVisibilityIcon = () => {
    if (analysis.isDraft) {
      return <DraftIcon fontSize="small" color="action" />;
    }
    return analysis.isPublic ? 
      <PublicIcon fontSize="small" color="success" /> : 
      <LockIcon fontSize="small" color="action" />;
  };

  const getVisibilityText = () => {
    if (analysis.isDraft) return 'Draft';
    return analysis.isPublic ? 'Public' : 'Private';
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
      onClick={() => onOpen(analysis)}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header with title and menu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3" sx={{ 
            fontWeight: 600, 
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {analysis.title}
          </Typography>
          
          {(isOwner || onShare) && (
            <IconButton 
              size="small" 
              onClick={handleMenuClick}
              sx={{ ml: 1, flexShrink: 0 }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>

        {/* Author info (if showing) */}
        {showAuthor && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              src={analysis.author.avatar} 
              sx={{ width: 24, height: 24, mr: 1 }}
            >
              {analysis.author.name.charAt(0)}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {analysis.author.name}
            </Typography>
          </Box>
        )}

        {/* Text preview */}
        <Box sx={{ 
          mb: 2, 
          p: 1.5, 
          bgcolor: 'grey.50', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              whiteSpace: 'pre-line',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {getPreviewText()}
          </Typography>
        </Box>

        {/* Description */}
        {analysis.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {analysis.description}
          </Typography>
        )}

        {/* Tags */}
        {analysis.tags && analysis.tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {analysis.tags.slice(0, 3).map((tag, index) => (
              <Chip 
                key={index} 
                label={tag} 
                size="small" 
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
            {analysis.tags.length > 3 && (
              <Chip 
                label={`+${analysis.tags.length - 3}`} 
                size="small" 
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            )}
          </Box>
        )}

        {/* Metadata */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={getVisibilityText()}>
              {getVisibilityIcon()}
            </Tooltip>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(analysis.createdAt, { addSuffix: true })}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <VisibilityIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {analysis.viewCount}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
        <Box>
          <IconButton size="small" onClick={handleLike} color={isLiked ? 'error' : 'default'}>
            {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            {analysis.likeCount + (isLiked && !analysis.isLiked ? 1 : 0)}
          </Typography>
        </Box>

        <Button 
          size="small" 
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(analysis);
          }}
        >
          Analyze
        </Button>
      </CardActions>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        {onShare && (
          <MenuItem onClick={handleShare}>
            <ShareIcon sx={{ mr: 1 }} />
            Share
          </MenuItem>
        )}
        {isOwner && onEdit && (
          <MenuItem onClick={handleEdit}>
            <EditIcon sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
        {isOwner && onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default AnalysisCard; 