import { Box, Typography, Link } from "@mui/material";

const Footer = () => {
  return (
    <Box component="footer" sx={{ py: 2, textAlign: 'center', mt: 'auto' }}>
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} Noctua Games. All Rights Reserved.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        <Link href="/privacy-policy" color="inherit">
          Privacy Policy
        </Link>
        {' | '}
        <Link href="/terms-of-service" color="inherit">
          Terms of Service
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer; 