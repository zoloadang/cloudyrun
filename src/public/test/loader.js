
        describe('foo', function() {
            it('pass', function() {
                expect(1).toEqual(1);
            });
                it('fail', function() {
                    expect(1).toEqual(1);
                });
        });
        
        describe('bar', function() {
            it('pass', function() {
                expect(1).toEqual(1);
            });
            it('fail', function() {
                expect(2).toEqual(3);
                // expect(1).toEqual(0);
            });
        });