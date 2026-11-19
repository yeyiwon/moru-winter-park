import {cameraDefaults} from './camera-policy.js';
// Activity metadata does not own camera orientation, zoom or FOV. Starting a
// gesture or sitting down must retain the user's view on both desktop and touch.
const activities=new Set(['eat','drink','bubble','wave','warm','roast','tea','dining','rest','skate']);
export function activityCameraView(kind){return activities.has(kind)?{keepUserView:true,lookHeight:cameraDefaults.focusHeight-1.2}:null;}
