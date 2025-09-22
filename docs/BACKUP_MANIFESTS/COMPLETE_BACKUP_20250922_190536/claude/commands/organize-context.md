# organize-context

Transform scattered Claude context process directories into a professional-grade documentation library with enhanced accessibility and 100% content preservation.

## Usage
```
/organize-context [source_path] [target_path] [date_pattern]
```

## Parameters
- **source_path** (required): Path containing process directories to organize
- **target_path** (required): Path where organized library will be created  
- **date_pattern** (optional): Date pattern to filter directories (default: all dates)

## Examples
```bash
# Organize all process directories
/organize-context /srv/.claude/context /srv/.claude/context/library

# Organize specific year's content
/organize-context /srv/.claude/context /srv/.claude/context/library 2025

# Organize specific month's content  
/organize-context /srv/.claude/context /srv/.claude/context/library 202508
```

## What This Command Does

This command implements a professional-grade documentation library creation methodology that:

1. **Analyzes Source Structure**: Discovers all process directories and identifies date patterns
2. **Creates Organized Library**: Builds `actions_YYYYMMDD` date-based directory structure
3. **Consolidates Content**: Uses specialized agents to group related content by subject/theme
4. **Preserves Everything**: Maintains 100% of original content while improving organization
5. **Creates Navigation**: Builds comprehensive indexes and cross-references
6. **Ensures Quality**: Implements professional documentation standards

## Implementation Instructions

When this command is executed, follow these steps:

### Phase 1: Analysis & Planning
```markdown
1. Use `mcp__filesystem__list_directory` to discover all process directories in source_path
2. Analyze directory naming patterns to extract dates (format: process_XXX_YYYYMMDD_HHMMSS)
3. Group directories by date and count content for planning
4. Create date-based target directory structure: actions_YYYYMMDD
```

### Phase 2: Library Structure Creation
```markdown
1. Create main library directory at target_path
2. Create subdirectories for each unique date found:
   - actions_20250828 (example)
   - actions_20250829 (example)
   - etc.
3. Prepare for content consolidation with consistent naming standards
```

### Phase 3: Content Processing (Use Agents)
```markdown
For each date group, use the documenter agent with this prompt:

"Process and reorganize all process directories from [DATE] in [SOURCE_PATH].

Your tasks:
1. Identify all process directories with timestamps [YYYYMMDD]
2. Read and analyze the content of each directory
3. Group related content by subject/theme/agent
4. Create consolidated, well-organized markdown files for [TARGET_PATH]/actions_[YYYYMMDD]/

For each consolidated file, use this naming pattern: [subject]_[YYYYMMDD].md

Examples:
- foundation_20250828.md (for foundation/setup work)
- validation_20250829.md (for testing/validation work)  
- deployment_20250830.md (for deployment activities)

Ensure all original content is preserved and include:
- Original timestamps
- Agent information  
- Task descriptions
- Complete documentation
- Cross-references where relevant"
```

### Phase 4: Index Creation
```markdown
1. Create master INDEX.md in library root with:
   - Library overview
   - Chronological content guide
   - Statistical summary
   - Usage instructions
   - Cross-references

2. Create individual README.md files in each actions_YYYYMMDD directory with:
   - Day's activities overview
   - Document summaries
   - Key achievements
   - Agent activity breakdown
```

### Phase 5: Verification & Quality Assurance
```markdown
1. Verify content preservation:
   - Count original directories vs. processed
   - Spot-check content completeness
   - Validate all timestamps and agent info preserved

2. Validate organization quality:
   - Check consistent naming conventions
   - Verify logical subject grouping
   - Test navigation and cross-references
   - Confirm professional documentation standards

3. Generate completion report with:
   - Processing statistics
   - Organization improvements
   - Quality metrics
   - Usage guidance
```

## Success Criteria
- ✅ 100% content preservation verified
- ✅ Professional documentation standards applied
- ✅ Enhanced accessibility achieved through subject-based organization
- ✅ Comprehensive navigation created
- ✅ Library ready for ongoing maintenance

## Output Structure
```
target_path/
├── INDEX.md                    # Master navigation
├── actions_YYYYMMDD/          # Date-based directories
│   ├── README.md              # Date overview
│   ├── subject1_YYYYMMDD.md   # Consolidated content
│   ├── subject2_YYYYMMDD.md   # Consolidated content
│   └── ...
└── DOCUMENTATION_LIBRARY_CREATION_GUIDE.md  # Methodology reference
```

## Notes
- Original process directories remain unchanged for safety
- All original timestamps, agent information, and technical content preserved
- Methodology based on successful transformation of 53 directories → 27 organized documents
- Suitable for enterprise documentation needs and long-term knowledge management

Refer to the complete methodology in `/srv/.claude/context/library/DOCUMENTATION_LIBRARY_CREATION_GUIDE.md` for detailed implementation guidance.