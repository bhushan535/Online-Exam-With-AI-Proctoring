import { handleStrike } from '../rules/StrikeManager';

export function handleViolationAction(event, callbacks, config) {
  handleStrike(event, {
    warnStudent: callbacks.warnStudent,
    submitExam: callbacks.submitExam
  }, config);
}
