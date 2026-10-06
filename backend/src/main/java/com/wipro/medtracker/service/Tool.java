package com.wipro.medtracker.service;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation for Spring AI & MedAdhere Dual-Engine Tools.
 * Denotes methods that can be autonomously invoked by the clinical reasoning engine.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Tool {
    String value() default "";
    String description() default "";
}
