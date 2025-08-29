import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并多个类名，并解决 Tailwind 类名冲突
 * @param inputs 类名数组
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期
 * @param date Date 对象或时间戳
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | number) {
  return new Date(date).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * 防抖函数
 * @param fn 需要防抖的函数
 * @param ms 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), ms)
  }
}

/**
 * 节流函数
 * @param fn 需要节流的函数
 * @param ms 延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  let lastFn: ReturnType<typeof setTimeout>
  let lastTime: number
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args)
      lastTime = Date.now()
      inThrottle = true
    } else {
      clearTimeout(lastFn)
      lastFn = setTimeout(() => {
        if (Date.now() - lastTime >= ms) {
          fn.apply(this, args)
          lastTime = Date.now()
        }
      }, Math.max(ms - (Date.now() - lastTime), 0))
    }
  }
}

/**
 * 随机生成 UUID
 * @returns UUID 字符串
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 深拷贝对象
 * @param obj 需要拷贝的对象
 * @returns 拷贝后的新对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  if (obj instanceof Array) {
    return obj.reduce((arr, item, i) => {
      arr[i] = deepClone(item)
      return arr
    }, [] as T[]) as T
  }

  if (obj instanceof Object) {
    return Object.keys(obj).reduce((newObj, key) => {
      newObj[key as keyof typeof newObj] = deepClone(obj[key as keyof typeof obj])
      return newObj
    }, {} as T)
  }

  return obj
}

/**
 * Security: Sanitize string input to prevent XSS
 * @param input The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>\"'&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        default: return char;
      }
    })
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Security: Validate string input
 * @param input The input to validate
 * @param maxLength Maximum allowed length
 * @param allowedChars Regex pattern for allowed characters
 * @returns Validation result
 */
export function validateInput(
  input: string, 
  maxLength: number = 1000, 
  allowedChars: RegExp = /^[a-zA-Z0-9\s\-_.,!@#$%^&*()+={}[\]:";'<>?/~`|\\]+$/
): { isValid: boolean; error?: string } {
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Input must be a string' };
  }
  
  if (input.length > maxLength) {
    return { isValid: false, error: `Input too long (max ${maxLength} characters)` };
  }
  
  if (!allowedChars.test(input)) {
    return { isValid: false, error: 'Input contains invalid characters' };
  }
  
  return { isValid: true };
}

/**
 * Security: Validate file extension
 * @param filename The filename to validate
 * @param allowedExtensions Array of allowed extensions
 * @returns Whether the file extension is allowed
 */
export function validateFileExtension(filename: string, allowedExtensions: string[] = ['.json', '.jsonl']): boolean {
  if (typeof filename !== 'string') return false;
  
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return allowedExtensions.includes(extension);
}

/**
 * Security: Rate limiting helper (simple in-memory implementation)
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60 * 1000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const requestTimes = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = requestTimes.filter(time => time > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
}

export const rateLimiter = new RateLimiter(); 