import { AppBar, Toolbar, Typography, IconButton, Avatar, Box } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import FeedbackIcon from '@mui/icons-material/Feedback';

const user = { name: "Demo User", avatarUrl: "" };
const project = "Agentic BI";
const organization = "Your Org";

export default function Header() {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {organization} / {project}
        </Typography>
        <IconButton color="inherit" title="Docs"><DescriptionIcon /></IconButton>
        <IconButton color="inherit" title="Settings"><SettingsIcon /></IconButton>
        <IconButton color="inherit" title="Feedback"><FeedbackIcon /></IconButton>
        <Box sx={{ ml: 2 }}>
          <Avatar alt={user.name} src={user.avatarUrl} />
        </Box>
      </Toolbar>
    </AppBar>
  );
} 