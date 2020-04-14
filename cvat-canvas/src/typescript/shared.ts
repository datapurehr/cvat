// Copyright (C) 2019-2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import * as SVG from 'svg.js';
import consts from './consts';
import { Position } from './canvasModel';

export interface ShapeSizeElement {
    sizeElement: any;
    update(shape: SVG.Shape): void;
    rm(): void;
}

export interface Box {
    xtl: number;
    ytl: number;
    xbr: number;
    ybr: number;
}

export interface BBox {
    width: number;
    height: number;
    x: number;
    y: number;
}

interface Point {
    x: number;
    y: number;
}

// Translate point array from the canvas coordinate system
// to the coordinate system of a client
export function translateFromSVG(svg: SVGSVGElement, points: number[]): number[] {
    const output = [];
    const transformationMatrix = svg.getScreenCTM() as DOMMatrix;
    let pt = svg.createSVGPoint();
    for (let i = 0; i < points.length - 1; i += 2) {
        pt.x = points[i];
        pt.y = points[i + 1];
        pt = pt.matrixTransform(transformationMatrix);
        output.push(pt.x, pt.y);
    }

    return output;
}

// Translate point array from the coordinate system of a client
// to the canvas coordinate system
export function translateToSVG(svg: SVGSVGElement, points: number[]): number[] {
    const output = [];
    const transformationMatrix = (svg.getScreenCTM() as DOMMatrix).inverse();
    let pt = svg.createSVGPoint();
    for (let i = 0; i < points.length; i += 2) {
        pt.x = points[i];
        pt.y = points[i + 1];
        pt = pt.matrixTransform(transformationMatrix);
        output.push(pt.x, pt.y);
    }

    return output;
}

export function pointsToString(points: number[]): string {
    return points.reduce((acc, val, idx): string => {
        if (idx % 2) {
            return `${acc},${val}`;
        }

        return `${acc} ${val}`.trim();
    }, '');
}

export function pointsToArray(points: string): number[] {
    return points.trim().split(/[,\s]+/g)
        .map((coord: string): number => +coord);
}

export function displayShapeSize(
    shapesContainer: SVG.Container,
    textContainer: SVG.Container,
): ShapeSizeElement {
    const shapeSize: ShapeSizeElement = {
        sizeElement: textContainer.text('').font({
            weight: 'bolder',
        }).fill('white').addClass('cvat_canvas_text'),
        update(shape: SVG.Shape): void{
            const bbox = shape.bbox();
            const text = `${bbox.width.toFixed(1)}x${bbox.height.toFixed(1)}`;
            const [x, y]: number[] = translateToSVG(
                textContainer.node as any as SVGSVGElement,
                translateFromSVG((shapesContainer.node as any as SVGSVGElement), [bbox.x, bbox.y]),
            );
            this.sizeElement.clear().plain(text)
                .move(x + consts.TEXT_MARGIN, y + consts.TEXT_MARGIN);
        },
        rm(): void {
            if (this.sizeElement) {
                this.sizeElement.remove();
                this.sizeElement = null;
            }
        },
    };

    return shapeSize;
}


export function convertToArray(points: Point[]): number[][] {
    const arr: number[][] = [];
    points.forEach((point: Point): void => {
        arr.push([point.x, point.y]);
    });
    return arr;
}

export function convertArrayToObjects(pointsArray: number[][]): Point[] {
    return pointsArray.reduce((points: Point[], point: number[]): Point[] => {
        const [x, y] = point;
        points.push({ x, y });
        return points;
    }, []);
}

export function convertArrayToDoubleArray(points: number[]): number[][] {
    if (points.length % 2 !== 0) {
        throw new Error('Points array must have length multiple of two.');
    }

    const pointsArray = [];

    for (let i = 0; i < points.length; i += 2) {
        pointsArray.push([points[i], points[i]]);
    }

    return pointsArray;
}

function line(p1: number[], p2: number[]): number[] {
    const a = p1[1] - p2[1];
    const b = p2[0] - p1[0];
    const c = b * p1[1] + a * p1[0];
    return [a, b, c];
}

export function intersection(
    p1: number[], p2: number[], p3: number[], p4: number[]
): number[] | null {
    const L1 = line(p1, p2);
    const L2 = line(p3, p4);

    const D = L1[0] * L2[1] - L1[1] * L2[0];
    const Dx = L1[2] * L2[1] - L1[1] * L2[2];
    const Dy = L1[0] * L2[2] - L1[2] * L2[0];

    let x = null;
    let y = null;
    if (D !== 0) {
        x = Dx / D;
        y = Dy / D;
        return [x, y];
    }

    return null;
}

export function clamp(x: number, min: number, max: number): number {
    return Math.min(Math.max(x, min), max);
};
