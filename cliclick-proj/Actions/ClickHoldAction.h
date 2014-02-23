//
//  ClickHoldAction.h
//  cliclick
//
//  Created by Jason Van on 2014-02-22.
//
//

#import <Cocoa/Cocoa.h>
#import "ActionProtocol.h"
#import "MouseBaseAction.h"

@interface ClickHoldAction : MouseBaseAction <ActionProtocol> {
    
}

+(NSString *)commandListShortcut;

-(NSString *)actionDescriptionString:(NSString *)locationDescription;

-(void)performActionAtPoint:(CGPoint) p;

@end
