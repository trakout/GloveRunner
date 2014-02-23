//
//  ClickHoldAction.m
//  cliclick
//
//  Created by Jason Van on 2014-02-22.
//
//

#import "ClickHoldAction.h"

@implementation ClickHoldAction

+(NSString *)commandListShortcut {
    return @"ch";
}

+(NSString *)commandDescription {
    return @"  c:x,y   Will CLICK at the point with the given coordinates.\n"
    "          Example: “c:12,34” will click at the point with x coordinate\n"
    "          12 and y coordinate 34. Instead of x and y values, you may\n"
    "          also use “.”, which means: the current position. Using “.” is\n"
    "          equivalent to using relative zero values “c:+0,+0”.";
}

-(NSString *)actionDescriptionString:(NSString *)locationDescription {
    return [NSString stringWithFormat:@"Click at %@", locationDescription];
}

-(void)performActionAtPoint:(CGPoint) p {
    // Left button down
    CGEventRef leftDown = CGEventCreateMouseEvent(NULL, kCGEventLeftMouseDown, CGPointMake(p.x, p.y), kCGMouseButtonLeft);
    CGEventPost(kCGHIDEventTap, leftDown);
}

@end