# MCP-INTEGRATION TEST

**Request från användare via [ask-da]:**

Add a simple TestMCPButton component that displays "MCP Test OK!" when clicked.

**Implementation:**
- Create `TestMCPButton.tsx` in `src/components/`
- Export a React component with a button
- onClick should show alert "MCP Test OK!"
- Use Tailwind CSS for styling

**Expected behavior:**
DeepAgent should:
1. Read this file
2. Create TestMCPButton.tsx
3. Commit with message: "[da-response] Added TestMCPButton per MCP test"
4. Push to flow-da-clean
