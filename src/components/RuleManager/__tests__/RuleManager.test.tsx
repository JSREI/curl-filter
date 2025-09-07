import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RuleManager from '../RuleManager'
import type { FilterRule } from '../../../types/filterRules'

// Mock the storage utilities
vi.mock('../../../utils/ruleStorage', () => ({
  loadRules: vi.fn(),
  saveRules: vi.fn(),
}))

vi.mock('../../../utils/indexedDBStorage', () => ({
  indexedDBStorageManager: {
    saveRules: vi.fn(),
    loadRules: vi.fn(),
  },
}))

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}))

import { loadRules, saveRules } from '../../../utils/ruleStorage'

const mockLoadRules = loadRules as any
const mockSaveRules = saveRules as any

describe('RuleManager - Rule Deletion', () => {
  const mockRules: FilterRule[] = [
    {
      id: 'rule1',
      name: 'Delete User-Agent',
      enabled: true,
      action: 'delete',
      target: 'headers',
      matchMode: 'exact',
      matchValue: 'user-agent',
      priority: 50,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'rule2',
      name: 'Delete Accept-Encoding',
      enabled: true,
      action: 'delete',
      target: 'headers',
      matchMode: 'exact',
      matchValue: 'accept-encoding',
      priority: 50,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadRules.mockResolvedValue(mockRules)
    mockSaveRules.mockResolvedValue(true)
  })

  it('should delete a rule and update the list', async () => {
    const onRulesChange = vi.fn()
    render(<RuleManager onRulesChange={onRulesChange} />)

    // Wait for rules to load
    await waitFor(() => {
      expect(screen.getByText('Delete User-Agent')).toBeInTheDocument()
      expect(screen.getByText('Delete Accept-Encoding')).toBeInTheDocument()
    })

    // Find and click the more actions button for the first rule
    const moreButtons = screen.getAllByLabelText('更多操作')
    fireEvent.click(moreButtons[0])

    // Click delete option
    const deleteButton = screen.getByText('删除规则')
    fireEvent.click(deleteButton)

    // Wait for the rule to be deleted
    await waitFor(() => {
      expect(mockSaveRules).toHaveBeenCalledWith([mockRules[1]]) // Only second rule should remain
    })

    // Verify onRulesChange was called with updated rules
    expect(onRulesChange).toHaveBeenCalledWith([mockRules[1]])
  })

  it('should handle deletion of all rules', async () => {
    const onRulesChange = vi.fn()
    mockLoadRules.mockResolvedValue([mockRules[0]]) // Start with only one rule
    
    render(<RuleManager onRulesChange={onRulesChange} />)

    // Wait for rule to load
    await waitFor(() => {
      expect(screen.getByText('Delete User-Agent')).toBeInTheDocument()
    })

    // Find and click the more actions button
    const moreButton = screen.getByLabelText('更多操作')
    fireEvent.click(moreButton)

    // Click delete option
    const deleteButton = screen.getByText('删除规则')
    fireEvent.click(deleteButton)

    // Wait for the rule to be deleted
    await waitFor(() => {
      expect(mockSaveRules).toHaveBeenCalledWith([]) // Empty array
    })

    // Verify onRulesChange was called with empty array
    expect(onRulesChange).toHaveBeenCalledWith([])
  })

  it('should refresh rules after deletion', async () => {
    const onRulesChange = vi.fn()
    render(<RuleManager onRulesChange={onRulesChange} />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Delete User-Agent')).toBeInTheDocument()
    })

    // Reset the mock call count after initial load
    mockLoadRules.mockClear()

    // Click refresh button
    const refreshButton = screen.getByLabelText('刷新规则')
    fireEvent.click(refreshButton)

    // Verify loadRules is called for refresh
    await waitFor(() => {
      expect(mockLoadRules).toHaveBeenCalledTimes(1)
    })
  })

  it('should show error message when deletion fails', async () => {
    const onRulesChange = vi.fn()
    mockSaveRules.mockResolvedValue(false) // Simulate save failure
    
    render(<RuleManager onRulesChange={onRulesChange} />)

    // Wait for rules to load
    await waitFor(() => {
      expect(screen.getByText('Delete User-Agent')).toBeInTheDocument()
    })

    // Delete a rule
    const moreButtons = screen.getAllByLabelText('更多操作')
    fireEvent.click(moreButtons[0])
    
    const deleteButton = screen.getByText('删除规则')
    fireEvent.click(deleteButton)

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('messages.saveFailed')).toBeInTheDocument()
    })
  })
})
