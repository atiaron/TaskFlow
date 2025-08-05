// החלף את הButtonBase בBox כדי למנוע button inside button
<BottomNavigationAction
  label={item.label}
  value={item.value}
  icon={
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {item.icon}
    </Box>
  }
  sx={{
    '& .MuiBottomNavigationAction-wrapper': {
      flexDirection: 'column'
    }
  }}
/>