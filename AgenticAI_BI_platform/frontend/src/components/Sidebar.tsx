import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Box, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HelpIcon from '@mui/icons-material/Help';
import TimelineIcon from '@mui/icons-material/Timeline';
import ChatIcon from '@mui/icons-material/Chat';

export default function Sidebar() {
  return (
    <Drawer variant="permanent" anchor="left">
      <Toolbar />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <List sx={{ flexGrow: 1 }}>
          <ListItem button key="Project Overview">
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Project Overview" />
          </ListItem>
          <ListItem button key="Help">
            <ListItemIcon><HelpIcon /></ListItemIcon>
            <ListItemText primary="Help" />
          </ListItem>
          <ListItem button key="Project Progress">
            <ListItemIcon><TimelineIcon /></ListItemIcon>
            <ListItemText primary="Project Progress" />
          </ListItem>
        </List>
        <Box sx={{ p: 2 }}>
          <Button variant="contained" color="primary" fullWidth startIcon={<ChatIcon />}>Chat</Button>
        </Box>
      </Box>
    </Drawer>
  );
} 