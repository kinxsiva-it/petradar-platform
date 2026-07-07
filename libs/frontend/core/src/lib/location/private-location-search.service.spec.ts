import { PrivateLocationSearchService } from './private-location-search.service.js';

describe('PrivateLocationSearchService', () => {
  const service = new PrivateLocationSearchService();

  it('finds Bangkok places by common landmark, district, and station aliases', () => {
    expect(service.search('ari')[0]).toMatchObject({
      label: 'Ari',
      latitude: 13.779926,
      longitude: 100.544984,
    });
    expect(service.search('jj market')[0]).toMatchObject({
      label: 'Chatuchak Weekend Market',
    });
    expect(service.search('watthana')[0]?.description).toContain('Watthana');
  });

  it('accepts pasted latitude and longitude as the exact private pin', () => {
    expect(service.search('13.767484, 100.512869')).toEqual([
      {
        description: 'Exact coordinates pasted into the private pin search',
        id: 'coordinates-13.767484-100.512869',
        kind: 'coordinates',
        label: 'Pasted coordinates',
        latitude: 13.767484,
        longitude: 100.512869,
      },
    ]);
  });

  it('does not return coordinates outside valid latitude and longitude bounds', () => {
    expect(service.search('113.767484, 100.512869')).toEqual([]);
    expect(service.search('13.767484, 200.512869')).toEqual([]);
  });
});
