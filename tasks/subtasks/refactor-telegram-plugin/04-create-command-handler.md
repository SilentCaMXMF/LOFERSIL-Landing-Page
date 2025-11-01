# 04. Create command handler module

meta:
id: refactor-telegram-plugin-04
feature: refactor-telegram-plugin
priority: P2
depends_on: [02, 03]
tags: [refactoring, modularization]

objective:

- Extract command handling logic into a dedicated module

deliverables:

- CommandHandler class or module
- Registry for bot commands

steps:

- Identify command handling logic in current code
- Create CommandHandler with methods for registering and executing commands
- Define command interfaces using types from task 02
- Update main plugin to use CommandHandler

tests:

- Unit: Test command registration and execution
- Integration: Commands work in Telegram bot

acceptance_criteria:

- Commands are handled by dedicated module
- Easy to add new commands
- Command validation and error handling included

validation:

- Bot responds correctly to commands
- Error cases handled gracefully

notes:

- Support both text commands (/start) and callback queries
- Consider command permissions if needed

analysis:

- Current command handling may be inline in event handlers
- Handler should support extensible command system
