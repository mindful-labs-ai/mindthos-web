import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../Button'

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  describe('variants', () => {
    it('renders solid variant', () => {
      render(<Button variant="solid">Solid</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary-500')
    })

    it('renders outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-2', 'border-primary-500')
    })

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-primary-600')
    })
  })

  describe('sizes', () => {
    it('renders small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')
    })

    it('renders medium size (default)', () => {
      render(<Button size="md">Medium</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4', 'py-2', 'text-base')
    })

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-5', 'py-2.5', 'text-lg')
    })
  })

  describe('disabled state', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      // Check for disabled classes (Tailwind applies these via disabled: prefix)
      expect(button.className).toContain('disabled:opacity-60')
      expect(button.className).toContain('disabled:cursor-not-allowed')
    })

    it('does not trigger onClick when disabled', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      )

      const button = screen.getByRole('button')
      await user.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toBeDisabled()

      // Check for spinner SVG
      const spinner = button.querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('does not trigger onClick when loading', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(
        <Button isLoading onClick={handleClick}>
          Loading
        </Button>
      )

      const button = screen.getByRole('button')
      await user.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has role="button"', () => {
      render(<Button>Accessible</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('sets aria-busy when loading', () => {
      render(<Button isLoading>Loading</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
    })

    it('sets aria-disabled when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    })

    it('is keyboard accessible', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Keyboard</Button>)

      const button = screen.getByRole('button')
      button.focus()

      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)

      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('has focus-visible styles', () => {
      render(<Button>Focus</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })
  })

  describe('custom className', () => {
    it('merges custom className with default classes', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('inline-flex') // default class
    })
  })
})
