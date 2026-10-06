import React from 'react';
import AiHealthChatbot from './AiHealthChatbot';

/**
 * AiCopilot delegates to the dynamic real-time AiHealthChatbot component.
 */
export default function AiCopilot(props) {
  return <AiHealthChatbot {...props} />;
}
