# Presentation Mode Feature

## Overview

The Presentation Mode transforms your event program into a full-screen, slide-style presentation that toastmasters can use live during events. It's like a lightweight PowerPoint specifically designed for event management.

## Features

### 🎬 **Full-Screen Presentation**
- Converts event segments into individual slides
- Large, readable typography optimized for presentation
- Responsive design for different screen sizes

### 🎯 **Smart Slide Generation**
- **Title Slide**: Event name, emoji, kickoff time, tone & type
- **Segment Slides**: One per program segment with duration, description, and type-specific emojis
- **Closing Slide**: "Thanks for Coming!" with optional call-to-action

### ⏰ **Timer & Countdown**
- Built-in timer for each segment
- Visual countdown with pulse animation when <1 minute remaining
- Start/Stop controls for each segment

### 🎮 **Multiple Navigation Options**
- **Keyboard**: Arrow keys, Space bar, Escape
- **Touch**: Swipe left/right on mobile/tablet
- **On-screen controls**: Auto-hiding navigation bar
- **Progress indicator**: Visual dots showing current position

### 📝 **Presenter Notes**
- Toggle presenter notes overlay (press 'N' or click button)
- Private notes not visible in guest display mode
- Uses segment content field for speaker notes

### 🎨 **Themed Design**
- Inherits color scheme from event tone
- Dynamic backgrounds based on event type
- Consistent with existing app design language

## How to Use

### Starting a Presentation

1. **From Event Program**: Click the "🎬 Start Presentation" button in the Event Program tab
2. **Direct URL**: Navigate to `/event/[eventId]/present?startIndex=0`

### Navigation Controls

- **← Previous**: Left arrow key, swipe right, or click "Previous" button
- **→ Next**: Right arrow key, Space bar, swipe left, or click "Next" button
- **Exit**: Escape key or click "Exit" button
- **Notes**: Press 'N' or click "Show Notes" button

### Timer Features

- Click "Start Timer" on any segment slide
- Timer counts down from segment duration
- Visual pulse when <1 minute remaining
- Click "Stop Timer" to pause/reset

## Technical Implementation

### Components

- `PresentationMode.tsx`: Main presentation component
- `page.tsx`: Route handler for `/event/[id]/present`

### State Management

- Current slide index
- Timer state and countdown
- Presenter notes visibility
- Control visibility (auto-hide)

### Data Flow

1. Event data passed to PresentationMode component
2. Slides generated from event timeline
3. Navigation state managed locally
4. Exit returns to Event Program dashboard

### Accessibility

- Minimum 4.5:1 contrast ratio
- Keyboard navigation support
- Screen reader friendly
- Responsive typography scaling

## Future Enhancements

### Stretch Goals

- **Dual-screen mode**: Separate presenter/audience views
- **Auto-advance**: Automatic slide progression
- **AI Script Generator**: Generate talking points per segment
- **Media integration**: Play music, show images, open game rules
- **Live collaboration**: Multiple presenters
- **Analytics**: Track presentation usage and timing

### Advanced Features

- **Custom themes**: User-defined presentation styles
- **Export options**: PDF, PowerPoint, or video
- **Remote control**: Mobile app as presentation remote
- **Live streaming**: Broadcast presentation to remote attendees

## Testing Checklist

- [x] Launch presentation from Event Program
- [x] Slides auto-generate from event data
- [x] Keyboard navigation works
- [x] Touch/swipe navigation works
- [x] Timer functionality
- [x] Presenter notes toggle
- [x] Exit flow returns to dashboard
- [x] Responsive design on different screen sizes
- [x] Accessibility compliance

## Usage Tips

1. **Prepare your segments**: Add detailed descriptions and speaker notes
2. **Test navigation**: Practice with keyboard and touch controls
3. **Use timer wisely**: Start timers only when ready to begin segments
4. **Keep notes handy**: Use presenter notes for key talking points
5. **Practice transitions**: Smooth navigation between slides

## Troubleshooting

### Common Issues

- **Slides not loading**: Ensure event has timeline segments
- **Timer not working**: Check segment has duration set
- **Navigation issues**: Try refreshing page or restarting presentation
- **Performance**: Close other browser tabs for better performance

### Support

For issues or feature requests, please refer to the main project documentation or create an issue in the repository. 