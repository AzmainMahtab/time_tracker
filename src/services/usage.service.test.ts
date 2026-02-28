import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsageService } from '../../src/services/usage.service.js';

describe('UsageService', () => {
  let service: UsageService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findLatest: vi.fn(),
      updateEndTime: vi.fn(),
      save: vi.fn(),
    };
    service = new UsageService(mockRepo);
  });

  it('should insert a new row if no previous session exists', async () => {
    mockRepo.findLatest.mockResolvedValue(null);
    const payload = {
      user_id: 1,
      app_name: 'Chrome',
      url: 'https://google.com',
      start_time: '2026-03-01T10:00:00Z',
      end_time: '2026-03-01T10:00:10Z'
    };

    await service.processUsage(payload);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should update end_time if start times match (idempotency)', async () => {
    mockRepo.findLatest.mockResolvedValue({
      id: 'uuid-1',
      startTime: new Date('2026-03-01T10:00:00Z'),
      endTime: new Date('2026-03-01T10:00:10Z'),
    });

    const payload = {
      user_id: 1,
      app_name: 'Chrome',
      url: 'https://google.com',
      start_time: '2026-03-01T10:00:00Z', // matches existing
      end_time: '2026-03-01T10:00:50Z'    // in future
    };

    await service.processUsage(payload);
    expect(mockRepo.updateEndTime).toHaveBeenCalledWith('uuid-1', expect.any(Date));
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should merge if gap is less than 30 seconds', async () => {
    mockRepo.findLatest.mockResolvedValue({
      id: 'uuid-2',
      appName: 'Chrome',
      domain: 'google.com',
      startTime: new Date('2026-03-01T10:00:00Z'),
      endTime: new Date('2026-03-01T10:00:10Z'),
    });

    const payload = {
      user_id: 1,
      app_name: 'Chrome',
      url: 'https://google.com',
      start_time: '2026-03-01T10:00:25Z',
      end_time: '2026-03-01T10:00:40Z'
    };

    await service.processUsage(payload);
    expect(mockRepo.updateEndTime).toHaveBeenCalled();
  });
});
