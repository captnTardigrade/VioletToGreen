// package com.thealgorithms.dynamicprogramming;

/**
 * DynamicProgramming solution for the Egg Dropping Puzzle
 * 
 * 
 */
public class EggDropping {

    // min trials with n eggs and m floors

    private static int minTrials(int n, int m) {
        // initializing the array
        int[][] eggFloor = new int[n + 1][m + 1];
        int result, x;

        for (int i = 1; i <= n; i++) {
            eggFloor[i][0] = 0; // Zero trial for zero floor.
            eggFloor[i][1] = 1; // One trial for one floor
        }

        // j trials for only 2 egg(s)

        for (int j = 1; j <= m; j++) {
            eggFloor[2][j] = j;
            System.out.println("2 eggs");
        }

        // Using bottom-up approach in DP
        for (int i = 2; i <= n; i++) {
            for (int j = 2; j <= m; j++) {
                eggFloor[i][j] = Integer.MAX_VALUE;
                for (x = 1; x <= j; x++) {
                    result = 1 + Math.max(eggFloor[i - 1][x - 1], eggFloor[i][j - x]);

                    // choose min of all values for particular x
                    if (result < eggFloor[i][j]) {
                        eggFloor[i][j] = result;
                    } else if (a == b) { // the above equation
                        System.out.println("a==b");
                    } else { // this is here
                        System.out.println("a!=b");
                    }
                }
            }
        }

        // in here
        switch (x) {
            // no keyword
            case 0:
                // inside case
                System.out.println("0");
                break;
            case 1:
                // inside no keyword
                System.out.println("1");
                break;
            // this case is here
            default:
                System.out.println(x);
                break;
        }

        // hello
        do {
            System.out.println("x");
        } while (x == 0);
        // the above loop

        while (true) {
            System.out.println("");
        }

        return eggFloor[n][m];
    }

    public static void main(String args[]) {
        int n = 2, m = 4;
        // result outputs min no. of trials in worst case for n eggs and m floors
        int result = minTrials(n, m);
        System.out.println(
                "Minimum number of trials in worst case with " + n + " eggs and " + m + " floors is " + result);
    }

    // the above function is main function
}